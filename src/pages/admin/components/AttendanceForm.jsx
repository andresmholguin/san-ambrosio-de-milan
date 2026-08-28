import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/useAuthStore";
import { getAllStudents } from "../../../services/studentService";
import { 
  saveAttendanceSession, 
  getAttendanceSessionByDateAndGrade 
} from "../../../services/attendanceService";
import { subscribeToClassrooms } from "../../../services/classroomService";

export function AttendanceForm() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === "admin";
  const userClassroom = user?.director_grupo && user?.director_grupo !== "Ninguno" ? user?.director_grupo : "";
  const todayStr = new Date().toISOString().split("T")[0];

  const [activeSubTab, setActiveSubTab] = useState("toma"); // "toma" | "historial"
  
  // 1. Estados para Toma y Modificación de Asistencia
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [gradoFiltro, setGradoFiltro] = useState(userClassroom || "1A");
  const [fechaAsistencia, setFechaAsistencia] = useState(todayStr);
  const [asistencia, setAsistencia] = useState({});
  const [existingSession, setExistingSession] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [novedadMotivo, setNovedadMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Estados para Consulta Filtrada del Historial
  const [historialGrado, setHistorialGrado] = useState(userClassroom || "1A");
  const [historialFecha, setHistorialFecha] = useState(todayStr);
  const [isSearchingHistorial, setIsSearchingHistorial] = useState(false);
  const [searchedSession, setSearchedSession] = useState(null);
  const [searchStudentInSession, setSearchStudentInSession] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedJustification, setSelectedJustification] = useState(null);

  // Cargar salones
  useEffect(() => {
    const unsubClassrooms = subscribeToClassrooms((list) => {
      setClassrooms(list);
      if (list.length > 0) {
        if (userClassroom) {
          setGradoFiltro(userClassroom);
          setHistorialGrado(userClassroom);
        } else if (!gradoFiltro || gradoFiltro === "1A") {
          setGradoFiltro(list[0].id);
          setHistorialGrado(list[0].id);
        }
      }
    });

    return () => unsubClassrooms();
  }, [userClassroom, gradoFiltro]);

  // Cargar estudiantes y verificar si ya existe asistencia guardada para esa fecha y grado
  const fetchStudentsAndExisting = useCallback(async () => {
    if (!gradoFiltro) return;
    setIsLoadingStudents(true);
    setIsEditingMode(false);
    setNovedadMotivo("");
    try {
      const all = await getAllStudents();
      const filterTarget = gradoFiltro.trim().toLowerCase();
      
      const filtered = all.filter(s => {
        const gradeSec = (s.student_grade_section || "").trim().toLowerCase();
        const grade = (s.student_grade || "").trim().toLowerCase();
        return gradeSec === filterTarget || grade === filterTarget;
      });
      
      // Consultar si ya existe sesión de asistencia guardada para esta fecha y grado
      const existing = await getAttendanceSessionByDateAndGrade(fechaAsistencia, gradoFiltro);
      setExistingSession(existing);

      const inicial = {};
      if (existing && existing.alumnos && existing.alumnos.length > 0) {
        // Cargar los estados guardados previamente
        filtered.forEach(s => {
          const prev = existing.alumnos.find(a => a.student_doc === s.student_doc);
          inicial[s.student_doc] = prev ? prev.estado : "Presente";
        });
      } else {
        // Inicializar por defecto a todos como presentes
        filtered.forEach(s => {
          inicial[s.student_doc] = "Presente";
        });
      }
      
      setStudents(filtered);
      setAsistencia(inicial);
    } catch (err) {
      console.error("Error al cargar estudiantes y asistencia previa:", err);
      toast.error("Error cargando estudiantes desde Firestore");
    } finally {
      setIsLoadingStudents(false);
    }
  }, [gradoFiltro, fechaAsistencia]);

  useEffect(() => {
    if (gradoFiltro) {
      fetchStudentsAndExisting();
    }
  }, [gradoFiltro, fechaAsistencia, fetchStudentsAndExisting]);

  const handleStatusChange = (docId, status) => {
    setAsistencia(prev => ({ ...prev, [docId]: status }));
  };

  // Verificación de límite de 24 horas y modificaciones para profesores
  const createdAtTime = existingSession?.createdAtIso 
    ? new Date(existingSession.createdAtIso).getTime() 
    : (existingSession?.fecha ? new Date(`${existingSession.fecha}T00:00:00`).getTime() : 0);

  const hoursPassed = createdAtTime ? (Date.now() - createdAtTime) / (1000 * 60 * 60) : 0;
  const isWithin24Hours = hoursPassed <= 24;
  const teacherModsCount = (existingSession?.historial_modificaciones || []).filter(m => m.rol !== "admin").length;
  
  const canTeacherModify = isAdmin || (teacherModsCount < 1 && isWithin24Hours);

  const handleSubmitAttendance = async () => {
    if (fechaAsistencia > todayStr) {
      toast.error("No se puede registrar asistencia en fechas posteriores al día actual.");
      return;
    }

    if (students.length === 0) {
      toast.error("No hay estudiantes en este salón.");
      return;
    }

    if (existingSession && !novedadMotivo.trim()) {
      toast.error("El motivo de la novedad es obligatorio para modificar la asistencia.");
      return;
    }

    setIsSubmitting(true);
    try {
      const studentsPayload = students.map(s => {
        const prevAl = existingSession?.alumnos?.find(a => a.student_doc === s.student_doc);
        return {
          student_doc: s.student_doc,
          student_name: `${s.student_name} ${s.student_lastname}`,
          grado: s.student_grade_section || s.student_grade || gradoFiltro,
          estado: asistencia[s.student_doc] || "Presente",
          parent_email: s.attendant_email || s.mother_email || s.father_email || "",
          attendant_name: s.attendant_name || "",
          attendant_phone: s.attendant_phone || "",
          token: prevAl?.token || null,
          justification_status: prevAl?.justification_status || null,
          parent_response: prevAl?.parent_response || null
        };
      });

      const updated = await saveAttendanceSession({
        fecha: fechaAsistencia,
        grado: gradoFiltro,
        profesor: user?.nombre || "Docente",
        userRole: user?.rol || "profesor",
        studentsAttendance: studentsPayload,
        novedadMotivo: novedadMotivo.trim()
      });

      setExistingSession(updated);
      setIsEditingMode(false);
      setNovedadMotivo("");

      if (existingSession) {
        toast.success("Modificación de asistencia guardada exitosamente.");
      } else {
        const faltas = studentsPayload.filter(s => s.estado === "Falta" || s.estado === "Retardo").length;
        toast.success(`Asistencia registrada. Se enviaron ${faltas} notificaciones a acudientes.`);
      }
      
    } catch (error) {
      console.error("Error al guardar sesión de asistencia:", error);
      toast.error(error.message || "Error al guardar asistencia");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Consulta de Historial Filtrado
  const handleSearchHistorial = async (e) => {
    e.preventDefault();
    if (!historialFecha || !historialGrado) {
      toast.error("Selecciona la fecha y el salón para consultar.");
      return;
    }

    if (historialFecha > todayStr) {
      toast.error("La fecha a consultar no puede ser posterior al día actual.");
      return;
    }

    setIsSearchingHistorial(true);
    setHasSearched(true);
    try {
      const session = await getAttendanceSessionByDateAndGrade(historialFecha, historialGrado);
      setSearchedSession(session);
    } catch (err) {
      console.error("Error al consultar historial:", err);
      toast.error("Error al consultar registro de asistencia.");
    } finally {
      setIsSearchingHistorial(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de Sub-pestañas */}
      <div className="flex gap-3 border-b border-gray-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveSubTab("toma")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === "toma"
              ? "bg-Sam text-white shadow-sm"
              : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
          }`}
        >
          {existingSession ? "Registro de Asistencia del Día" : "Toma de Asistencia Express"}
        </button>
        <button
          onClick={() => setActiveSubTab("historial")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === "historial"
              ? "bg-Sam text-white shadow-sm"
              : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
          }`}
        >
          Consultar Historial por Fecha y Salón
        </button>
      </div>

      {activeSubTab === "toma" ? (
        /* VISTA 1: TOMA Y MODIFICACIÓN DE ASISTENCIA */
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {existingSession ? "Registro de Asistencia Existente" : "Control de Asistencia Express"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {existingSession 
                  ? "Ya se guardó la asistencia de esta fecha y salón. Puedes consultar el resumen o solicitar su modificación."
                  : "Registra la asistencia del día. Solo se permite 1 registro por fecha y grado."}
              </p>
            </div>

            {existingSession && (
              <span className="bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold self-start">
                ✓ Asistencia ya Registrada
              </span>
            )}
          </div>

          {/* Selector de Salón y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Salón / Grado</label>
              {isAdmin ? (
                classrooms.length > 0 ? (
                  <select
                    value={gradoFiltro}
                    onChange={(e) => setGradoFiltro(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} ({c.director_nombre})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={gradoFiltro}
                    onChange={(e) => setGradoFiltro(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                    placeholder="Ej: PRIMERO o 2A"
                  />
                )
              ) : (
                <div className="bg-gray-100 dark:bg-slate-700/60 p-2.5 rounded-xl border text-xs font-bold text-slate-700 dark:text-slate-200">
                  {gradoFiltro} (Tu Salón Asignado)
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha</label>
              <input
                type="date"
                value={fechaAsistencia}
                max={todayStr}
                onChange={(e) => setFechaAsistencia(e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
              />
            </div>

            <div className="flex items-end">
              <button 
                onClick={fetchStudentsAndExisting}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-colors w-full text-xs cursor-pointer"
              >
                Recargar Salón ({students.length})
              </button>
            </div>
          </div>

          {isLoadingStudents ? (
            <p className="text-center text-slate-500 text-sm my-8">Cargando datos del salón {gradoFiltro}...</p>
          ) : students.length === 0 ? (
            <p className="text-center text-slate-500 text-sm my-8">
              No se encontraron estudiantes asignados al salón "{gradoFiltro}".
            </p>
          ) : existingSession && !isEditingMode ? (
            /* CASO 1: YA EXISTE ASISTENCIA Y NO ESTÁ EN MODO EDICIÓN -> MOSTRAR RESUMEN Y BOTÓN MODIFICAR */
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 p-6 rounded-2xl flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    📅 Resumen del Registro: {existingSession.fecha} &bull; Grado {existingSession.grado}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Registrado inicialmente por: <strong>{existingSession.profesor}</strong> &bull; Total estudiantes: {existingSession.total_alumnos}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 font-bold px-3 py-1 rounded-full">
                    {existingSession.presentes_count} Presentes
                  </span>
                  <span className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold px-3 py-1 rounded-full">
                    {existingSession.faltas_count} Faltas
                  </span>
                  {existingSession.retardos_count > 0 && (
                    <span className="bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold px-3 py-1 rounded-full">
                      {existingSession.retardos_count} Retardos
                    </span>
                  )}
                </div>
              </div>

              {/* Trazabilidad de Novedades si existen */}
              {existingSession.historial_modificaciones && existingSession.historial_modificaciones.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs">
                  <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">
                    Novedades previas ({existingSession.historial_modificaciones.length}):
                  </p>
                  <ul className="space-y-1 text-amber-700 dark:text-amber-400 text-[11px]">
                    {existingSession.historial_modificaciones.map((mod, idx) => (
                      <li key={idx}>
                        &bull; <strong>{new Date(mod.fechaHora).toLocaleString()}</strong> por {mod.modificadoPor}: {mod.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Control de Permisos y Botón de Modificación */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="text-xs">
                  {!isAdmin ? (
                    !isWithin24Hours ? (
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        ⚠️ El plazo de 24 horas para realizar modificaciones ha vencido. Para cambios adicionales, contacta al administrador.
                      </span>
                    ) : teacherModsCount >= 1 ? (
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        ⚠️ Has alcanzado el límite de 1 modificación diaria permitida. Para cambios adicionales, contacta al administrador.
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">
                        ℹ️ Tienes <strong>1 modificación permitida</strong> dentro del plazo de 24 horas para este registro.
                      </span>
                    )
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      🛡️ Modo Administrador: Modificaciones ilimitadas habilitadas.
                    </span>
                  )}
                </div>

                {canTeacherModify && (
                  <button
                    onClick={() => setIsEditingMode(true)}
                    className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-xs flex items-center gap-2 cursor-pointer shadow-md self-end sm:self-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Modificar Asistencia de Este Día
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* CASO 2: ASISTENCIA NUEVA O EN MODO EDICIÓN ACTIVO -> MOSTRAR TABLA DE ALUMNOS Y FORMULARIO */
            <>
              {isEditingMode && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl mb-6 text-xs text-amber-800 dark:text-amber-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold">Modo Edición Activo</p>
                    <p className="text-[11px] opacity-90">Modifica los estados de los estudiantes y describe la novedad abajo.</p>
                  </div>
                  <button
                    onClick={() => setIsEditingMode(false)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                </div>
              )}

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                      <th className="p-3 font-semibold">Estudiante</th>
                      <th className="p-3 font-semibold text-center text-green-600">Presente</th>
                      <th className="p-3 font-semibold text-center text-red-600">Falta</th>
                      <th className="p-3 font-semibold text-center text-blue-600">Excusa</th>
                      <th className="p-3 font-semibold text-center text-orange-600">Retardo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {students.map((student) => {
                      const status = asistencia[student.student_doc];
                      return (
                        <tr key={student.student_doc} className="text-xs hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {student.student_name} {student.student_lastname}
                            <span className="block text-[11px] text-slate-400 font-normal">
                              {student.student_doc} &bull; Acudiente: {student.attendant_email || "Sin correo registrado"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <input type="radio" name={`ast_${student.student_doc}`} checked={status === "Presente"} onChange={() => handleStatusChange(student.student_doc, "Presente")} className="w-4 h-4 text-green-600 accent-green-600 cursor-pointer" />
                          </td>
                          <td className="p-3 text-center">
                            <input type="radio" name={`ast_${student.student_doc}`} checked={status === "Falta"} onChange={() => handleStatusChange(student.student_doc, "Falta")} className="w-4 h-4 text-red-600 accent-red-600 cursor-pointer" />
                          </td>
                          <td className="p-3 text-center">
                            <input type="radio" name={`ast_${student.student_doc}`} checked={status === "Excusa"} onChange={() => handleStatusChange(student.student_doc, "Excusa")} className="w-4 h-4 text-blue-600 accent-blue-600 cursor-pointer" />
                          </td>
                          <td className="p-3 text-center">
                            <input type="radio" name={`ast_${student.student_doc}`} checked={status === "Retardo"} onChange={() => handleStatusChange(student.student_doc, "Retardo")} className="w-4 h-4 text-orange-600 accent-orange-600 cursor-pointer" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Si es modificación, campo para registrar motivo de la novedad OBLIGATORIO */}
              {existingSession && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1.5 flex items-center gap-1">
                    <span>Motivo de la Novedad / Modificación</span>
                    <span className="text-red-500 font-bold">* (Obligatorio)</span>
                  </label>
                  <input
                    type="text"
                    value={novedadMotivo}
                    onChange={(e) => setNovedadMotivo(e.target.value)}
                    placeholder="Ej. Se actualizó la asistencia de María por ingreso tardío justificado"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-600 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                    Este motivo quedará asentado en el historial de trazabilidad de la institución.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-gray-100 dark:border-slate-700 pt-6">
                {isEditingMode ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingMode(false)}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                ) : <div />}

                <button
                  onClick={handleSubmitAttendance}
                  disabled={isSubmitting}
                  className="bg-Sam hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2 cursor-pointer shadow-md text-sm"
                >
                  {isSubmitting ? "Guardando..." : (existingSession ? "Guardar Modificación de Asistencia" : "Guardar Asistencia del Día")}
                  {!isSubmitting && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* VISTA 2: CONSULTA FILTRADA DE HISTORIAL POR FECHA Y SALÓN */
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Consulta de Registro por Fecha y Salón
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Selecciona el salón y la fecha deseada para validar la asistencia y consultar las justificaciones de los padres.
            </p>
          </div>

          {/* Formulario de Filtro */}
          <form onSubmit={handleSearchHistorial} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700/60 items-end">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Salón / Grado</label>
              {isAdmin ? (
                <select
                  value={historialGrado}
                  onChange={(e) => setHistorialGrado(e.target.value)}
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} ({c.director_nombre})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border text-xs font-bold text-slate-700 dark:text-slate-200">
                  {historialGrado} (Tu Salón)
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha a Consultar</label>
              <input
                type="date"
                value={historialFecha}
                max={todayStr}
                onChange={(e) => setHistorialFecha(e.target.value)}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSearchingHistorial}
              className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              {isSearchingHistorial ? "Consultando..." : "🔍 Consultar Registro"}
            </button>
          </form>

          {/* Resultado de la Consulta */}
          {hasSearched && (
            <div>
              {!searchedSession ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-xs text-slate-500">
                  No se encontró registro de asistencia para el salón <strong>{historialGrado}</strong> en la fecha <strong>{historialFecha}</strong>.
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/40">
                  {/* Encabezado del Registro */}
                  <div className="p-5 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        📅 {searchedSession.fecha} &bull; Grado {searchedSession.grado}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Registrado por: <strong>{searchedSession.profesor}</strong> &bull; Total matriculados: {searchedSession.total_alumnos} alumnos
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 font-bold px-2.5 py-1 rounded-full">
                        {searchedSession.presentes_count} Presentes
                      </span>
                      <span className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold px-2.5 py-1 rounded-full">
                        {searchedSession.faltas_count} Faltas
                      </span>
                      {searchedSession.retardos_count > 0 && (
                        <span className="bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold px-2.5 py-1 rounded-full">
                          {searchedSession.retardos_count} Retardos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Historial de Novedades/Modificaciones si existen */}
                  {searchedSession.historial_modificaciones && searchedSession.historial_modificaciones.length > 0 && (
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 text-xs">
                      <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">Trazabilidad de Novedades:</p>
                      <ul className="space-y-1 text-amber-700 dark:text-amber-400 text-[11px]">
                        {searchedSession.historial_modificaciones.map((mod, i) => (
                          <li key={i}>
                            &bull; <strong>{new Date(mod.fechaHora).toLocaleString()}</strong> por {mod.modificadoPor}: {mod.motivo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Listado de Estudiantes del Registro con Buscador Integrado */}
                  <div className="p-4 md:p-6 bg-white dark:bg-slate-800">
                    {(() => {
                      const filteredAlumnosInSession = (searchedSession.alumnos || []).filter(al => {
                        const term = searchStudentInSession.toLowerCase().trim();
                        if (!term) return true;
                        return (
                          (al.student_name || "").toLowerCase().includes(term) ||
                          (al.student_doc || "").toLowerCase().includes(term)
                        );
                      });

                      return (
                        <>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                              Listado de Asistencia ({filteredAlumnosInSession.length} de {(searchedSession.alumnos || []).length} estudiantes):
                            </h4>

                            <div className="w-full sm:w-80">
                              <input
                                type="text"
                                value={searchStudentInSession}
                                onChange={(e) => setSearchStudentInSession(e.target.value)}
                                placeholder="🔍 Buscar estudiante o documento en este registro..."
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-Sam"
                              />
                            </div>
                          </div>

                          {filteredAlumnosInSession.length === 0 ? (
                            <p className="text-center py-6 text-xs text-slate-400 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                              No se encontraron estudiantes que coincidan con "<strong>{searchStudentInSession}</strong>" en este registro.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-gray-200 dark:border-slate-700 text-slate-500">
                                    <th className="p-2.5 font-semibold">Estudiante</th>
                                    <th className="p-2.5 font-semibold">Estado</th>
                                    <th className="p-2.5 font-semibold">Estado de Justificación</th>
                                    <th className="p-2.5 font-semibold text-right">Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                  {filteredAlumnosInSession.map((al) => {
                                    const isJustified = al.justification_status === "Justificada por Acudiente" || al.parent_response;
                                    return (
                                      <tr key={al.student_doc} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                                          {al.student_name}
                                          <span className="block text-[11px] font-normal text-slate-400">
                                            {al.student_doc} &bull; Acudiente: {al.parent_email || "Sin correo"}
                                          </span>
                                        </td>
                                        <td className="p-2.5">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            al.estado === "Presente" ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300" :
                                            al.estado === "Falta" ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" :
                                            al.estado === "Retardo" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300" :
                                            "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                          }`}>
                                            {al.estado}
                                          </span>
                                        </td>
                                        <td className="p-2.5">
                                          {al.estado === "Presente" ? (
                                            <span className="text-slate-400 text-[11px]">-</span>
                                          ) : isJustified ? (
                                            <span className="bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                              ✓ Justificada por Acudiente
                                            </span>
                                          ) : (
                                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                              ⏳ Pendiente de Respuesta
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-right">
                                          {isJustified && (
                                            <button
                                              onClick={() => setSelectedJustification({
                                                ...al,
                                                fecha: searchedSession.fecha,
                                                grado: searchedSession.grado
                                              })}
                                              className="bg-Sam text-white font-bold px-3 py-1 rounded-xl text-[11px] hover:bg-green-700 transition-colors cursor-pointer"
                                            >
                                              Ver Excusa
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Detalles de la Justificación del Padre */}
      {selectedJustification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Justificación del Acudiente
              </h3>
              <button 
                onClick={() => setSelectedJustification(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                <div><span className="text-slate-400">Estudiante:</span> <strong>{selectedJustification.student_name}</strong></div>
                <div><span className="text-slate-400">Documento:</span> <strong>{selectedJustification.student_doc}</strong></div>
                <div><span className="text-slate-400">Grado:</span> <strong>{selectedJustification.grado}</strong></div>
                <div><span className="text-slate-400">Fecha Inasistencia:</span> <strong>{selectedJustification.fecha}</strong></div>
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Motivo Manifestado</label>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200 font-bold rounded-xl border border-green-200 dark:border-green-800">
                  {selectedJustification.parent_response?.motivo || "No especificado"}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Explicación / Detalle del Acudiente</label>
                <div className="p-3 bg-gray-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl border border-gray-200 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedJustification.parent_response?.detalle || "Sin descripción adicional."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-slate-500 border-t border-gray-100 dark:border-slate-700">
                <div>
                  <span className="block text-[11px] text-slate-400">Acudiente que Respondió:</span>
                  <strong>{selectedJustification.parent_response?.parentName || "Acudiente"}</strong>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Teléfono:</span>
                  <strong>{selectedJustification.parent_response?.parentPhone || "No registrado"}</strong>
                </div>
              </div>

              <button
                onClick={() => setSelectedJustification(null)}
                className="w-full mt-4 py-2.5 bg-Sam hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
