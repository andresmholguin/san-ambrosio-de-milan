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
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { sendNotification } from "./notificationService";

const STUDENTS_COLLECTION = "students";

/**
 * Verifica si ya existe un estudiante registrado con el documento especificado.
 * @param {string} studentDoc 
 * @returns {Promise<boolean>}
 */
export async function checkStudentExists(studentDoc) {
  if (!studentDoc) return false;
  const raw = String(studentDoc).trim();
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, raw);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return true;

    // Consultar por el campo student_doc
    const colRef = collection(db, STUDENTS_COLLECTION);
    const qSnap = await getDocs(query(colRef, where("student_doc", "==", raw)));
    return !qSnap.empty;
  } catch (error) {
    console.error("Error al verificar estudiante en Firestore:", error);
    throw error;
  }
}

/**
 * Sanitiza recursivamente un objeto de estudiante para almacenar todos los campos de texto
 * en MAYÚSCULAS (a excepción de correos electrónicos en minúsculas y fechas/tokens).
 * @param {Object} data 
 * @returns {Object}
 */
export function sanitizeStudentData(data) {
  if (!data || typeof data !== "object") return data;
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      const isEmail = key.toLowerCase().includes("email") || key.toLowerCase().includes("correo");
      const isDate = key.toLowerCase().includes("date") || key.toLowerCase().includes("iso") || key.toLowerCase().includes("birth") || key.toLowerCase().includes("nacimiento") || key.toLowerCase().includes("fecha");
      const isToken = key.toLowerCase().includes("token") || key.toLowerCase().includes("password") || key.toLowerCase().includes("hash");

      if (isEmail) {
        sanitized[key] = value.trim().toLowerCase();
      } else if (isDate || isToken) {
        sanitized[key] = value.trim();
      } else {
        sanitized[key] = value.trim().toUpperCase();
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeStudentData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Guarda o actualiza los datos de un estudiante.
 * @param {Object} studentData
 * @returns {Promise<void>}
 */
export async function saveStudent(studentData) {
  const cleanData = sanitizeStudentData(studentData);
  const docId = String(cleanData.student_doc || "").trim().toUpperCase();
  if (!docId) throw new Error("El documento del estudiante es obligatorio");

  const docRef = doc(db, STUDENTS_COLLECTION, docId);
  const now = new Date().toISOString();

  const payload = {
    ...cleanData,
    student_doc: docId,
    updatedAt: now,
  };

  const existingSnap = await getDoc(docRef);
  if (!existingSnap.exists()) {
    payload.createdAt = now;
  }

  await setDoc(docRef, payload, { merge: true });

  // Notificación interna en segundo plano para docentes y directores
  try {
    await sendNotification({
      title: "Expediente de Estudiante Actualizado",
      message: `${payload.student_name} ${payload.student_lastname} (Grado ${payload.student_grade || "N/A"}) ha actualizado sus datos.`,
      type: "student_update",
      targetDoc: docId,
      recipientRole: "all"
    });
  } catch (notifErr) {
    console.warn("No se pudo emitir la notificación interna:", notifErr);
  }
}

/**
 * Obtiene un estudiante específico por su documento.
 * @param {string} studentDoc 
 * @returns {Promise<Object|null>}
 */
export async function getStudentByDoc(studentDoc) {
  if (!studentDoc) return null;
  const raw = String(studentDoc).trim();
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, raw);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    const colRef = collection(db, STUDENTS_COLLECTION);
    const qSnap = await getDocs(query(colRef, where("student_doc", "==", raw)));
    if (!qSnap.empty) {
      const d = qSnap.docs[0];
      return { id: d.id, ...d.data() };
    }
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
  }
  return null;
}

/**
 * Obtiene todos los estudiantes registrados.
 * @returns {Promise<Array>}
 */
export async function getAllStudents() {
  const colRef = collection(db, STUDENTS_COLLECTION);
  const q = query(colRef, orderBy("student_lastname", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Suscripción en tiempo real al listado de estudiantes.
 * @param {Function} onUpdate Callback con la lista actualizada de estudiantes.
 * @param {Function} onError Callback en caso de error.
 * @returns {Function} Unsubscribe function.
 */
export function subscribeToStudents(onUpdate, onError) {
  const colRef = collection(db, STUDENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar alfabéticamente por apellido y nombre
      studentsList.sort((a, b) => {
        const nameA = `${a.student_lastname || ""} ${a.student_name || ""}`.toLowerCase();
        const nameB = `${b.student_lastname || ""} ${b.student_name || ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      onUpdate(studentsList);
    },
    (error) => {
      console.error("Error en suscripción de estudiantes:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Actualiza parcialmente los datos de un estudiante.
 * @param {string} studentDoc 
 * @param {Object} updatedFields 
 * @returns {Promise<void>}
 */
export async function updateStudent(studentDoc, updatedFields) {
  const cleanFields = sanitizeStudentData(updatedFields);
  const docRef = doc(db, STUDENTS_COLLECTION, String(studentDoc).trim().toUpperCase());
  await updateDoc(docRef, {
    ...cleanFields,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Elimina el registro de un estudiante en Firestore.
 * @param {string} studentDoc 
 * @returns {Promise<void>}
 */
export async function deleteStudent(studentDoc) {
  const raw = String(studentDoc).trim();
  const docRef = doc(db, STUDENTS_COLLECTION, raw);
  await deleteDoc(docRef);
}
