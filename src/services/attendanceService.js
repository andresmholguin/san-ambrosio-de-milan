import { 
  collection, 
  doc, 
  writeBatch, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { sendNotification } from "./notificationService";
import { sendAbsenceNotificationEmail } from "./emailService";

const ATTENDANCES_COLLECTION = "attendances";
const SESSIONS_COLLECTION = "attendance_sessions";

/**
 * Obtiene la sesión de asistencia registrada para una fecha y grado específico.
 * @param {string} fecha YYYY-MM-DD
 * @param {string} grado Ej: "PRIMERO", "2A"
 * @returns {Promise<Object|null>}
 */
export async function getAttendanceSessionByDateAndGrade(fecha, grado) {
  if (!fecha || !grado) return null;
  const cleanFecha = String(fecha).trim();
  const cleanGrado = String(grado).trim().toUpperCase();
  const sessionId = `${cleanFecha}_${cleanGrado.replace(/\s+/g, "_")}`;

  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }

    // Consulta fallback por campos individuales
    const colRef = collection(db, SESSIONS_COLLECTION);
    const q = query(colRef, where("fecha", "==", cleanFecha), where("grado", "==", cleanGrado));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const d = querySnap.docs[0];
      return { id: d.id, ...d.data() };
    }
  } catch (err) {
    console.error("Error al consultar sesión de asistencia:", err);
  }
  return null;
}

/**
 * Guarda o actualiza la sesión de asistencia para una fecha y grado/salón específico.
 * Si ya existe para ese día y grado, actualiza los registros y deja la trazabilidad de la novedad/modificación.
 * @param {Object} sessionData { fecha, grado, profesor, studentsAttendance, novedadMotivo }
 */
export async function saveAttendanceSession({ fecha, grado, profesor, userRole = "profesor", studentsAttendance, novedadMotivo = "" }) {
  if (!fecha || !grado || !studentsAttendance || studentsAttendance.length === 0) {
    throw new Error("Datos de asistencia incompletos.");
  }

  const cleanFecha = String(fecha).trim();
  const cleanGrado = String(grado).trim().toUpperCase();
  const sessionId = `${cleanFecha}_${cleanGrado.replace(/\s+/g, "_")}`;
  const now = new Date().toISOString();

  const batch = writeBatch(db);
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

  // Verificar si ya existe para auditar la novedad y validar límites
  const existingSnap = await getDoc(sessionRef);
  const isUpdate = existingSnap.exists();
  let historialModificaciones = [];

  if (isUpdate) {
    const prevData = existingSnap.data();
    historialModificaciones = prevData.historial_modificaciones || [];

    // Validar límite para profesores (máximo 1 modificación y dentro de las primeras 24 horas)
    if (userRole !== "admin") {
      const createdAtTimestamp = prevData.createdAtIso 
        ? new Date(prevData.createdAtIso).getTime() 
        : new Date(`${prevData.fecha}T00:00:00`).getTime();
      const hoursPassed = (new Date(now).getTime() - createdAtTimestamp) / (1000 * 60 * 60);

      if (hoursPassed > 24) {
        throw new Error("El plazo de 24 horas para modificar este registro de asistencia ha vencido. Contacta al administrador para realizar cambios.");
      }

      const teacherMods = historialModificaciones.filter(m => m.rol !== "admin").length;
      if (teacherMods >= 1) {
        throw new Error("Has alcanzado el límite de 1 modificación permitida por día. Para cambios adicionales, contacta al administrador.");
      }
    }

    historialModificaciones.push({
      modificadoPor: profesor || "Docente",
      rol: userRole || "profesor",
      fechaHora: now,
      motivo: novedadMotivo || "Modificación de estados de asistencia del día"
    });
  }

  const absencesToNotify = [];
  const processedStudents = [];

  let presentes = 0;
  let faltas = 0;
  let retardos = 0;
  let excusas = 0;

  studentsAttendance.forEach((st) => {
    const estado = st.estado || "Presente";
    const isAbsence = estado === "Falta" || estado === "Retardo";
    const token = isAbsence ? (st.token || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2, 9))) : null;

    if (estado === "Presente") presentes++;
    else if (estado === "Falta") faltas++;
    else if (estado === "Retardo") retardos++;
    else if (estado === "Excusa") excusas++;

    const studentRecord = {
      student_doc: st.student_doc,
      student_name: st.student_name,
      grado: cleanGrado,
      fecha: cleanFecha,
      estado: estado,
      profesor: profesor || "Docente",
      parent_email: st.parent_email || st.attendant_email || st.mother_email || st.father_email || "",
      attendant_name: st.attendant_name || "",
      attendant_phone: st.attendant_phone || "",
      token: token,
      justification_status: isAbsence ? (st.justification_status || "Pendiente") : "No requerida",
      parent_response: st.parent_response || null,
      updatedAt: now
    };

    processedStudents.push(studentRecord);

    // Si es inasistencia, registrar también en attendances para consulta directa de justificación
    if (isAbsence && token) {
      const attDocRef = doc(db, ATTENDANCES_COLLECTION, token);
      batch.set(attDocRef, {
        ...studentRecord,
        sessionId: sessionId,
        createdAtIso: now
      }, { merge: true });

      // Solo despachar email si es nueva falta y no tiene justificación previa
      if (studentRecord.parent_email && !st.parent_response) {
        absencesToNotify.push({
          studentName: studentRecord.student_name,
          studentDoc: studentRecord.student_doc,
          grade: cleanGrado,
          date: cleanFecha,
          teacherName: profesor,
          parentEmail: studentRecord.parent_email,
          token: token
        });
      }
    }
  });

  const sessionPayload = {
    id: sessionId,
    fecha: cleanFecha,
    grado: cleanGrado,
    profesor: profesor || "Docente",
    total_alumnos: studentsAttendance.length,
    presentes_count: presentes,
    faltas_count: faltas,
    retardos_count: retardos,
    excusas_count: excusas,
    alumnos: processedStudents,
    historial_modificaciones: historialModificaciones,
    es_modificada: isUpdate,
    ultima_modificacion: isUpdate ? now : null,
    createdAt: isUpdate ? (existingSnap.data().createdAt || serverTimestamp()) : serverTimestamp(),
    createdAtIso: isUpdate ? (existingSnap.data().createdAtIso || now) : now,
    updatedAt: now
  };

  batch.set(sessionRef, sessionPayload, { merge: true });
  await batch.commit();

  // Enviar correos de inasistencia a padres
  absencesToNotify.forEach((item) => {
    sendAbsenceNotificationEmail(item).catch((err) =>
      console.warn(`Error enviando correo a ${item.parentEmail}:`, err)
    );
  });

  // Notificación interna
  try {
    await sendNotification({
      title: isUpdate ? `Asistencia Modificada - Grado ${cleanGrado}` : `Asistencia Registrada - Grado ${cleanGrado}`,
      message: `${profesor || "Docente"} ${isUpdate ? "actualizó la novedad de" : "guardó"} la asistencia del ${cleanFecha}: ${faltas} falta(s) y ${retardos} retardo(s).`,
      type: "attendance_alert",
      recipientRole: "all"
    });
  } catch (err) {
    console.warn("No se pudo enviar notificación de asistencia:", err);
  }

  return sessionPayload;
}

/**
 * Suscripción en tiempo real a las sesiones de asistencia agrupadas por Fecha y Grado.
 * @param {Function} callback 
 * @param {Function} onError 
 * @returns {Function} Unsubscribe
 */
export function subscribeToAttendanceSessions(callback, onError) {
  const colRef = collection(db, SESSIONS_COLLECTION);
  const q = query(colRef, orderBy("fecha", "desc"), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    },
    (error) => {
      console.error("Error en suscripción de sesiones de asistencia:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Obtiene el registro de inasistencia a través de su token único de justificación.
 * @param {string} token 
 * @returns {Promise<Object|null>}
 */
export async function getAttendanceByToken(token) {
  if (!token) return null;
  const rawToken = String(token).trim();

  const directSnap = await getDoc(doc(db, ATTENDANCES_COLLECTION, rawToken));
  if (directSnap.exists()) {
    return { id: directSnap.id, ...directSnap.data() };
  }

  const colRef = collection(db, ATTENDANCES_COLLECTION);
  const q = query(colRef, where("token", "==", rawToken));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const firstDoc = snapshot.docs[0];
    return { id: firstDoc.id, ...firstDoc.data() };
  }

  return null;
}

/**
 * Registra la respuesta y justificación del padre de familia y actualiza tanto el registro
 * individual como la sesión consolidada por Fecha y Grado.
 * @param {Object} data { token, motivo, detalle, parentName, parentPhone }
 */
export async function submitJustification({ token, motivo, detalle, parentName, parentPhone }) {
  const record = await getAttendanceByToken(token);
  if (!record) {
    throw new Error("El enlace de justificación no es válido o ha expirado.");
  }

  const now = new Date().toISOString();
  const responsePayload = {
    motivo: motivo || "No especificado",
    detalle: detalle || "",
    parentName: parentName || "Acudiente",
    parentPhone: parentPhone || "",
    respondedAt: now
  };

  // 1. Actualizar documento individual en attendances
  const attDocRef = doc(db, ATTENDANCES_COLLECTION, record.id || token);
  await updateDoc(attDocRef, {
    justification_status: "Justificada por Acudiente",
    estado: "Excusa",
    parent_response: responsePayload,
    updatedAt: now
  });

  // 2. Actualizar el estudiante dentro de su sesión por Fecha y Grado (attendance_sessions)
  if (record.sessionId) {
    try {
      const sessionRef = doc(db, SESSIONS_COLLECTION, record.sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        let faltasCount = 0;
        let excusasCount = 0;

        const updatedAlumnos = (sessionData.alumnos || []).map(al => {
          if (al.token === token || al.student_doc === record.student_doc) {
            excusasCount++;
            return {
              ...al,
              estado: "Excusa",
              justification_status: "Justificada por Acudiente",
              parent_response: responsePayload
            };
          }
          if (al.estado === "Falta") faltasCount++;
          if (al.estado === "Excusa") excusasCount++;
          return al;
        });

        await updateDoc(sessionRef, {
          alumnos: updatedAlumnos,
          faltas_count: faltasCount,
          excusas_count: excusasCount,
          updatedAt: now
        });
      }
    } catch (err) {
      console.warn("No se pudo sincronizar justificación en attendance_sessions:", err);
    }
  }

  // 3. Emitir notificación interna para docente y coordinación
  try {
    await sendNotification({
      title: `Justificación Recibida (${record.student_name})`,
      message: `${parentName || "El acudiente"} justificó la falta del ${record.fecha} (Grado ${record.grado}): "${motivo} - ${detalle.substring(0, 50)}..."`,
      type: "observation",
      targetDoc: record.student_doc,
      recipientRole: "all"
    });
  } catch (err) {
    console.warn("No se pudo emitir notificación interna de justificación:", err);
  }

  return { success: true };
}

/**
 * Obtiene todas las inasistencias y excusas de un estudiante específico.
 * @param {string} studentDoc 
 * @returns {Promise<Array>}
 */
export async function getAttendancesByStudent(studentDoc) {
  if (!studentDoc) return [];
  const colRef = collection(db, ATTENDANCES_COLLECTION);
  const q = query(colRef, where("student_doc", "==", String(studentDoc).trim()));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
}
