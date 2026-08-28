import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { db, initMessaging } from "../firebase/config";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Emite una notificación interna en Firestore.
 * @param {Object} notifData { title, message, type, recipientRole, targetDoc, senderName }
 */
export async function sendNotification({
  title,
  message,
  type = "info", // "info" | "student_update" | "attendance_alert" | "observation"
  recipientRole = "all", // "all" | "admin" | "profesor"
  targetDoc = null,
  senderName = "Sistema"
}) {
  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    await addDoc(colRef, {
      title,
      message,
      type,
      recipientRole,
      targetDoc,
      senderName,
      readBy: [],
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al guardar notificación en Firestore:", error);
  }
}

/**
 * Suscripción en tiempo real a las notificaciones más recientes.
 * @param {Function} callback Recibe el array de notificaciones.
 * @param {Function} onError Callback en caso de fallo.
 * @returns {Function} Unsubscribe function.
 */
export function subscribeToNotifications(callback, onError) {
  const colRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(colRef, orderBy("createdAtIso", "desc"), limit(30));

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      callback(notifications);
    },
    (error) => {
      console.error("Error escuchando notificaciones:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Marca una notificación como leída por un usuario específico.
 * @param {string} notifId 
 * @param {string} userDoc 
 */
export async function markNotificationAsRead(notifId, userDoc) {
  if (!notifId || !userDoc) return;
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    // Para simplificar, agregamos el userDoc al array readBy
    await updateDoc(docRef, {
      [`readBy_${userDoc}`]: true
    });
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
  }
}

/**
 * Inicializa y solicita permisos para Web Push & Mobile Push Notifications (FCM).
 * @returns {Promise<string|null>} Token FCM del dispositivo o null si no se concede permiso.
 */
export async function requestPushPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Este navegador no soporta notificaciones de escritorio/móviles.");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Permiso de notificaciones denegado por el usuario.");
    return null;
  }

  try {
    const messaging = await initMessaging();
    if (!messaging) return null;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });

    if (currentToken) {
      console.log("FCM Token obtenido:", currentToken);
      return currentToken;
    }
  } catch (error) {
    console.error("Error al obtener token FCM:", error);
  }

  return null;
}

/**
 * Escucha notificaciones push en primer plano (Foreground).
 * @param {Function} onMessageReceived 
 */
export async function listenForegroundPush(onMessageReceived) {
  const messaging = await initMessaging();
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log("Mensaje push en primer plano recibido:", payload);
      if (onMessageReceived) onMessageReceived(payload);
    });
  }
}
