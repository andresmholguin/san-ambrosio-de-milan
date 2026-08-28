import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { sendNotification } from "./notificationService";

const OBSERVATIONS_COLLECTION = "observations";

/**
 * Agrega una nueva anotación al observador del estudiante.
 * @param {Object} data 
 */
export async function addObservation(data) {
  const colRef = collection(db, OBSERVATIONS_COLLECTION);
  const now = new Date().toISOString();

  const payload = {
    ...data,
    id_anotacion: data.id_anotacion || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
    student_doc: String(data.student_doc).trim(),
    categoria: data.categoria || "Académica",
    privacidad: data.privacidad || "Pública",
    createdAt: serverTimestamp(),
    createdAtIso: now
  };

  const docRef = await addDoc(colRef, payload);

  // Emitir notificación interna
  try {
    await sendNotification({
      title: `Nueva Anotación (${payload.categoria})`,
      message: `${payload.profesor_nombre || "Un docente"} agregó una anotación al estudiante (Doc. ${payload.student_doc}).`,
      type: "observation",
      targetDoc: payload.student_doc,
      recipientRole: payload.privacidad === "Restringida" ? "admin" : "all"
    });
  } catch (err) {
    console.warn("No se pudo enviar notificación de anotación:", err);
  }

  return { id: docRef.id, ...payload };
}

/**
 * Consulta las anotaciones del observador de un estudiante.
 * @param {string} studentDoc 
 * @returns {Promise<Array>}
 */
export async function getObservationsByStudent(studentDoc) {
  if (!studentDoc) return [];
  const colRef = collection(db, OBSERVATIONS_COLLECTION);
  const q = query(colRef, where("student_doc", "==", String(studentDoc).trim()));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Ordenar de más reciente a más antiguo
  return list.sort((a, b) => (b.createdAtIso || b.fecha || "").localeCompare(a.createdAtIso || a.fecha || ""));
}

/**
 * Suscripción en tiempo real a las anotaciones del estudiante.
 * @param {string} studentDoc 
 * @param {Function} onUpdate 
 * @param {Function} onError 
 * @returns {Function} Unsubscribe
 */
export function subscribeToObservations(studentDoc, onUpdate, onError) {
  if (!studentDoc) return () => {};
  const colRef = collection(db, OBSERVATIONS_COLLECTION);
  const q = query(colRef, where("student_doc", "==", String(studentDoc).trim()));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAtIso || b.fecha || "").localeCompare(a.createdAtIso || a.fecha || ""));
      onUpdate(list);
    },
    (error) => {
      console.error("Error en suscripción de observaciones:", error);
      if (onError) onError(error);
    }
  );
}
