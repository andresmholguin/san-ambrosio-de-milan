import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getAllStudents } from "./studentService";

const CLASSROOMS_COLLECTION = "classrooms";
const STUDENTS_COLLECTION = "students";

/**
 * Crea o actualiza un salón de clases.
 * @param {Object} data { grado_base, seccion, director_doc, director_nombre }
 */
export async function createOrUpdateClassroom({ grado_base, seccion, director_doc, director_nombre }) {
  const cleanGrado = String(grado_base).trim().toUpperCase();
  const cleanSeccion = seccion ? String(seccion).trim().toUpperCase() : "";
  const classroomId = cleanSeccion ? `${cleanGrado}${cleanSeccion}` : cleanGrado; // Ej: "2A", "PRIMERO", "11B"

  const docRef = doc(db, CLASSROOMS_COLLECTION, classroomId);
  const now = new Date().toISOString();

  // Calcular número actual de estudiantes en este salón
  const allStudents = await getAllStudents();
  const studentsInClass = allStudents.filter(s => 
    (s.student_grade || "").trim().toUpperCase() === classroomId ||
    (s.student_grade_section || "").trim().toUpperCase() === classroomId
  );

  const payload = {
    id: classroomId,
    grado_base: cleanGrado,
    seccion: cleanSeccion,
    nombre_salon: (cleanSeccion ? `GRADO ${cleanGrado} - SECCIÓN ${cleanSeccion}` : `GRADO ${cleanGrado}`).toUpperCase(),
    director_doc: director_doc || "",
    director_nombre: (director_nombre || "SIN ASIGNAR").toUpperCase(),
    estudiantes_count: studentsInClass.length,
    updatedAt: now
  };

  const existing = await getDoc(docRef);
  if (!existing.exists()) {
    payload.createdAt = now;
  }

  await setDoc(docRef, payload, { merge: true });

  // Si se asignó un director docente, actualizar su perfil de usuario
  if (director_doc) {
    try {
      const userRef = doc(db, "users", String(director_doc).trim());
      await updateDoc(userRef, {
        director_grupo: classroomId
      });
    } catch (err) {
      console.warn("No se pudo actualizar director_grupo en users:", err);
    }
  }

  return payload;
}

/**
 * Actualiza el nombre personalizado o director de un salón existente.
 * @param {string} classroomId 
 * @param {Object} data { nombre_salon, director_doc, director_nombre }
 */
export async function updateClassroomDetails(classroomId, { nombre_salon, director_doc, director_nombre }) {
  const docRef = doc(db, CLASSROOMS_COLLECTION, String(classroomId).trim());
  const now = new Date().toISOString();

  const payload = {
    nombre_salon: String(nombre_salon || `GRADO ${classroomId}`).trim().toUpperCase(),
    director_doc: director_doc || "",
    director_nombre: String(director_nombre || "SIN ASIGNAR").trim().toUpperCase(),
    updatedAt: now
  };

  await updateDoc(docRef, payload);

  // Sincronizar en users
  if (director_doc) {
    try {
      const userRef = doc(db, "users", String(director_doc).trim());
      await updateDoc(userRef, {
        director_grupo: classroomId
      });
    } catch (err) {
      console.warn("No se pudo actualizar director_grupo en users:", err);
    }
  }

  return payload;
}

/**
 * Obtiene todos los salones registrados.
 * @returns {Promise<Array>}
 */
export async function getAllClassrooms() {
  const colRef = collection(db, CLASSROOMS_COLLECTION);
  const q = query(colRef, orderBy("id", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Suscripción en tiempo real a los salones.
 * @param {Function} callback 
 * @param {Function} onError 
 * @returns {Function} Unsubscribe
 */
export function subscribeToClassrooms(callback, onError) {
  const colRef = collection(db, CLASSROOMS_COLLECTION);
  const q = query(colRef, orderBy("id", "asc"));

  return onSnapshot(
    q,
    async (snapshot) => {
      const classrooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(classrooms);
    },
    (error) => {
      console.error("Error en suscripción de salones:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Elimina un salón de clases.
 * @param {string} classroomId 
 */
export async function deleteClassroom(classroomId) {
  const docRef = doc(db, CLASSROOMS_COLLECTION, String(classroomId).trim());
  await deleteDoc(docRef);
}

/**
 * Asigna una lista de estudiantes a un salón específico o los desasigna.
 * @param {Array<string>} studentDocs Array de documentos de los estudiantes
 * @param {string} classroomId Identificador del salón (ej. "2A" o "SIN_ASIGNAR")
 */
export async function assignStudentsToClassroom(studentDocs, classroomId) {
  if (!studentDocs || studentDocs.length === 0) return;

  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const cleanClassroom = classroomId && classroomId !== "SIN_ASIGNAR" ? String(classroomId).trim().toUpperCase() : "";

  studentDocs.forEach(docId => {
    const studentRef = doc(db, STUDENTS_COLLECTION, String(docId).trim());
    batch.update(studentRef, {
      student_grade: cleanClassroom || "Sin Asignar",
      student_grade_section: cleanClassroom,
      updatedAt: now
    });
  });

  await batch.commit();
  await refreshClassroomsStudentCount();
}

/**
 * Recalcula y sincroniza el total de estudiantes en cada salón registrado.
 */
export async function refreshClassroomsStudentCount() {
  try {
    const allStudents = await getAllStudents();
    const classrooms = await getAllClassrooms();

    const batch = writeBatch(db);

    classrooms.forEach(c => {
      const count = allStudents.filter(s => 
        (s.student_grade || "").trim().toUpperCase() === c.id.toUpperCase() ||
        (s.student_grade_section || "").trim().toUpperCase() === c.id.toUpperCase()
      ).length;

      const cRef = doc(db, CLASSROOMS_COLLECTION, c.id);
      batch.update(cRef, { estudiantes_count: count });
    });

    await batch.commit();
  } catch (err) {
    console.error("Error al refrescar contador de estudiantes:", err);
  }
}
