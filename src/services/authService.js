import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { hashPassword } from "../utils/crypto";

const USERS_COLLECTION = "users";

/**
 * Si la colección de usuarios está vacía, inicializa una cuenta de Administrador por defecto
 * para permitir el primer acceso en una base de datos limpia.
 */
export async function seedInitialAdminIfEmpty() {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const adminDocRef = doc(db, USERS_COLLECTION, "admin");
      await setDoc(adminDocRef, {
        id_documento: "admin",
        nombre: "ADMINISTRADOR GENERAL",
        rol: "admin",
        director_grupo: "Ninguno",
        password_hash: "", // Requiere crear contraseña en primer ingreso
        estado: "Activo",
        primer_ingreso: "true",
        createdAt: new Date().toISOString()
      });
      console.log("Cuenta inicial 'admin' creada con éxito en Firestore.");
    }
  } catch (err) {
    console.warn("No se pudo verificar / sembrar admin inicial:", err);
  }
}

/**
 * Busca un usuario del staff por su número de documento o ID de documento.
 * Soporta búsqueda por ID de documento y por el campo interno 'id_documento',
 * insensible a mayúsculas/minúsculas.
 * @param {string} documento 
 * @returns {Promise<Object|null>}
 */
export async function findUserByDoc(documento) {
  if (!documento) return null;
  const raw = String(documento).trim();
  const lower = raw.toLowerCase();
  const upper = raw.toUpperCase();

  // 1. Intentar búsqueda directa por ID de documento en Firestore
  const directRefs = [raw, lower, upper];
  for (const idToTry of directRefs) {
    try {
      const snap = await getDoc(doc(db, USERS_COLLECTION, idToTry));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (e) {
      console.warn("Intento getDoc falló:", e);
    }
  }

  // 2. Intentar consultas por el campo 'id_documento'
  const colRef = collection(db, USERS_COLLECTION);
  const queriesToTry = [
    query(colRef, where("id_documento", "==", raw)),
    query(colRef, where("id_documento", "==", upper)),
    query(colRef, where("id_documento", "==", lower))
  ];

  for (const q of queriesToTry) {
    try {
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        return { id: firstDoc.id, ...firstDoc.data() };
      }
    } catch (e) {
      console.warn("Intento query falló:", e);
    }
  }

  // 3. Fallback: Búsqueda flexible en todos los usuarios (para tolerar espacios o variantes)
  try {
    const allSnap = await getDocs(colRef);
    if (allSnap.empty) {
      // Si está vacía la colección, sembrar admin inicial
      await seedInitialAdminIfEmpty();
      if (lower === "admin" || lower === "admon") {
        return {
          id: "admin",
          id_documento: "admin",
          nombre: "ADMINISTRADOR GENERAL",
          rol: "admin",
          director_grupo: "Ninguno",
          password_hash: "",
          estado: "Activo",
          primer_ingreso: "true"
        };
      }
      return null;
    }

    const matched = allSnap.docs.find(d => {
      const data = d.data();
      const docField = String(data.id_documento || "").trim().toLowerCase();
      const docKey = d.id.trim().toLowerCase();
      return docField === lower || docKey === lower;
    });

    if (matched) {
      return { id: matched.id, ...matched.data() };
    }
  } catch (err) {
    console.error("Error al buscar en Firestore:", err);
  }

  return null;
}

/**
 * Establece la contraseña para un usuario en su primer ingreso.
 * @param {string} docOrUserId ID del documento en Firestore o id_documento
 * @param {string} password 
 */
export async function createStaffPassword(docOrUserId, password) {
  const targetId = String(docOrUserId).trim();
  const hashedPassword = await hashPassword(password);
  
  // Buscar la referencia correcta
  let targetRef = doc(db, USERS_COLLECTION, targetId);
  const directSnap = await getDoc(targetRef);

  if (!directSnap.exists()) {
    // Si no existe con ese ID, buscar por el campo id_documento
    const userObj = await findUserByDoc(targetId);
    if (userObj && userObj.id) {
      targetRef = doc(db, USERS_COLLECTION, userObj.id);
    }
  }

  await updateDoc(targetRef, {
    password_hash: hashedPassword,
    primer_ingreso: "false",
    updatedAt: new Date().toISOString()
  });

  return hashedPassword;
}

/**
 * Registra un nuevo profesor o administrativo.
 * @param {Object} staffData { id_documento, nombre, rol, director_grupo, email, etc. }
 */
export async function registerStaff(staffData) {
  const docId = String(staffData.id_documento).trim();
  if (!docId) throw new Error("El documento es obligatorio");

  const docRef = doc(db, USERS_COLLECTION, docId);
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    throw new Error("Ya existe un usuario registrado con este documento.");
  }

  const payload = {
    id_documento: docId.toUpperCase(),
    nombre: (staffData.nombre || "").toUpperCase().trim(),
    rol: staffData.rol || "profesor",
    director_grupo: (staffData.director_grupo || "NINGUNO").toUpperCase().trim(),
    email: (staffData.email || "").toLowerCase().trim(),
    password_hash: "",
    estado: "Activo",
    primer_ingreso: "true",
    createdAt: new Date().toISOString()
  };

  await setDoc(docRef, payload);
  return payload;
}

/**
 * Obtiene todos los profesores registrados.
 * @returns {Promise<Array>}
 */
export async function getProfessors() {
  const colRef = collection(db, USERS_COLLECTION);
  const q = query(colRef, where("rol", "==", "profesor"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Suscripción en tiempo real a los profesores registrados.
 * @param {Function} onUpdate 
 * @returns {Function} Unsubscribe
 */
export function subscribeToProfessors(onUpdate, onError) {
  const colRef = collection(db, USERS_COLLECTION);
  const q = query(colRef, where("rol", "==", "profesor"));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      onUpdate(list);
    },
    (error) => {
      console.error("Error en suscripción de profesores:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Obtiene todos los usuarios staff (admins y profesores).
 * @returns {Promise<Array>}
 */
export async function getAllStaff() {
  const colRef = collection(db, USERS_COLLECTION);
  const querySnapshot = await getDocs(colRef);
  const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
}

/**
 * Suscripción en tiempo real a todo el personal staff.
 * @param {Function} onUpdate 
 */
export function subscribeToAllStaff(onUpdate, onError) {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      onUpdate(list);
    },
    (error) => {
      console.error("Error en suscripción de personal:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Actualiza los datos de un usuario staff.
 * @param {string} docId 
 * @param {Object} updatedFields 
 */
export async function updateStaff(docId, updatedFields) {
  const targetId = String(docId).trim();
  let docRef = doc(db, USERS_COLLECTION, targetId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    const userObj = await findUserByDoc(targetId);
    if (userObj && userObj.id) {
      docRef = doc(db, USERS_COLLECTION, userObj.id);
    }
  }

  const payload = {
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  if (payload.nombre) payload.nombre = String(payload.nombre).toUpperCase().trim();
  if (payload.director_grupo) payload.director_grupo = String(payload.director_grupo).toUpperCase().trim();
  if (payload.email) payload.email = String(payload.email).toLowerCase().trim();

  await updateDoc(docRef, payload);
}

/**
 * Elimina un usuario staff en Firestore.
 * @param {string} docId 
 */
export async function deleteStaff(docId) {
  const targetId = String(docId).trim();
  let docRef = doc(db, USERS_COLLECTION, targetId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    const userObj = await findUserByDoc(targetId);
    if (userObj && userObj.id) {
      docRef = doc(db, USERS_COLLECTION, userObj.id);
    }
  }

  await deleteDoc(docRef);
}

/**
 * Restablece la contraseña de un profesor forzando un nuevo primer ingreso.
 * @param {string} docId 
 */
export async function resetStaffPassword(docId) {
  await updateStaff(docId, {
    password_hash: "",
    primer_ingreso: "true"
  });
}
