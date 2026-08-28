import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  subscribeToClassrooms, 
  createOrUpdateClassroom, 
  updateClassroomDetails,
  deleteClassroom, 
  assignStudentsToClassroom,
  refreshClassroomsStudentCount
} from "../../../services/classroomService";
import { subscribeToProfessors } from "../../../services/authService";
import { subscribeToStudents } from "../../../services/studentService";

export function ClassroomsManager() {
  const [activeSubTab, setActiveSubTab] = useState("salones"); // "salones" | "distribucion"

  const [classrooms, setClassrooms] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formulario crear nuevo salón
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [gradoBase, setGradoBase] = useState("2");
  const [seccion, setSeccion] = useState("A");
  const [selectedProfDoc, setSelectedProfDoc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Salón seleccionado para consulta y gestión
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);
  const [isEditingClassroomInfo, setIsEditingClassroomInfo] = useState(false);
  const [editNombreSalon, setEditNombreSalon] = useState("");
  const [editDirectorDoc, setEditDirectorDoc] = useState("");
  const [isSavingClassroom, setIsSavingClassroom] = useState(false);
  const [searchInClassroom, setSearchInClassroom] = useState("");

  // Modal para mover estudiante individual o en lote
  const [studentToMove, setStudentToMove] = useState(null); // estudiante individual a mover
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false); // modal lote
  const [selectedClassroomStudentDocs, setSelectedClassroomStudentDocs] = useState([]);
  const [targetMoveClassroom, setTargetMoveClassroom] = useState("");
  const [isMovingStudent, setIsMovingStudent] = useState(false);

  // Distribución masiva de estudiantes (Sub-pestaña 2)
  const [distribucionGrado, setDistribucionGrado] = useState("");
  const [selectedStudentDocs, setSelectedStudentDocs] = useState([]);
  const [targetClassroom, setTargetClassroom] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");

  useEffect(() => {
    setIsLoading(true);
    refreshClassroomsStudentCount();

    const unsubClassrooms = subscribeToClassrooms((data) => setClassrooms(data));
    const unsubProfs = subscribeToProfessors((data) => setProfessors(data));
    const unsubStudents = subscribeToStudents((data) => {
      setStudents(data);
      setIsLoading(false);
    });

    return () => {
      unsubClassrooms();
      unsubProfs();
      unsubStudents();
    };
  }, []);

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId);

  // Al seleccionar un salón para consultar
  const handleSelectClassroom = (c) => {
    setSelectedClassroomId(c.id);
    setIsEditingClassroomInfo(false);
    setEditNombreSalon(c.nombre_salon || `Grado ${c.id}`);
    setEditDirectorDoc(c.director_doc || "");
    setSelectedClassroomStudentDocs([]);
    setSearchInClassroom("");
    setStudentToMove(null);
  };

  // Manejador para crear nuevo salón
  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!gradoBase.trim()) {
      toast.error("El grado base es obligatorio (ej. 1, 2, Transición).");
      return;
    }

    setIsCreating(true);
    try {
      const prof = professors.find(p => p.id_documento === selectedProfDoc);
      const directorNombre = prof ? prof.nombre : "Sin Asignar";

      const created = await createOrUpdateClassroom({
        grado_base: gradoBase.trim(),
        seccion: seccion.trim(),
        director_doc: selectedProfDoc,
        director_nombre: directorNombre
      });

      toast.success(`Salón ${created.id} creado con éxito.`);
      setIsCreatingNew(false);
      setSeccion("");
      setSelectedProfDoc("");
    } catch (err) {
      console.error("Error al crear salón:", err);
      toast.error(err.message || "Error al crear salón.");
    } finally {
      setIsCreating(false);
    }
  };

  // Guardar cambios de edición de datos del salón
  const handleSaveClassroomDetails = async (e) => {
    e.preventDefault();
    if (!selectedClassroom) return;

    setIsSavingClassroom(true);
    try {
      const prof = professors.find(p => p.id_documento === editDirectorDoc);
      const directorNombre = prof ? prof.nombre : "Sin Asignar";

      await updateClassroomDetails(selectedClassroom.id, {
        nombre_salon: editNombreSalon,
        director_doc: editDirectorDoc,
        director_nombre: directorNombre
      });

      toast.success(`Datos del salón ${selectedClassroom.id} actualizados correctamente.`);
      setIsEditingClassroomInfo(false);
    } catch (err) {
      console.error("Error al actualizar salón:", err);
      toast.error("Error al guardar cambios del salón.");
    } finally {
      setIsSavingClassroom(false);
    }
  };

  // Eliminar salón
  const handleDeleteClassroom = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el salón ${id}? Los estudiantes asignados quedarán sin sección.`)) {
      return;
    }

    try {
      await deleteClassroom(id);
      if (selectedClassroomId === id) {
        setSelectedClassroomId(null);
      }
      toast.success(`Salón ${id} eliminado.`);
    } catch (err) {
      console.error("Error al eliminar salón:", err);
      toast.error("No se pudo eliminar el salón.");
    }
  };

  // Ejecutar movimiento de estudiante individual
  const handleConfirmMoveSingleStudent = async () => {
    if (!studentToMove) return;

    setIsMovingStudent(true);
    try {
      await assignStudentsToClassroom([studentToMove.student_doc], targetMoveClassroom);
      toast.success(targetMoveClassroom && targetMoveClassroom !== "SIN_ASIGNAR"
        ? `Estudiante ${studentToMove.student_name} movido al salón ${targetMoveClassroom}.`
        : `Estudiante ${studentToMove.student_name} quitado del salón.`
      );
      setStudentToMove(null);
      setTargetMoveClassroom("");
    } catch (err) {
      console.error("Error al mover estudiante:", err);
      toast.error("Error al reasignar estudiante.");
    } finally {
      setIsMovingStudent(false);
    }
  };

  // Ejecutar movimiento en lote de estudiantes
  const handleConfirmBatchMove = async () => {
    if (selectedClassroomStudentDocs.length === 0) return;

    setIsMovingStudent(true);
    try {
      await assignStudentsToClassroom(selectedClassroomStudentDocs, targetMoveClassroom);
      toast.success(`${selectedClassroomStudentDocs.length} estudiante(s) actualizados.`);
      setSelectedClassroomStudentDocs([]);
      setIsBatchMoveModalOpen(false);
      setTargetMoveClassroom("");
    } catch (err) {
      console.error("Error al mover lote:", err);
      toast.error("Error al mover estudiantes.");
    } finally {
      setIsMovingStudent(false);
    }
  };

  // Estudiantes asignados al salón seleccionado
  const studentsInSelectedClassroom = students.filter(s => {
    if (!selectedClassroomId) return false;
    const gSec = (s.student_grade_section || "").trim().toUpperCase();
    const g = (s.student_grade || "").trim().toUpperCase();
    const target = selectedClassroomId.toUpperCase();
    const matchesRoom = gSec === target || g === target;

    const term = searchInClassroom.toLowerCase();
    const matchesSearch = !term || 
      (s.student_name || "").toLowerCase().includes(term) ||
      (s.student_lastname || "").toLowerCase().includes(term) ||
      (s.student_doc || "").toLowerCase().includes(term);

    return matchesRoom && matchesSearch;
  });

  // Distribuidor Masivo (Sub-pestaña 2)
  const studentsToDistribute = students.filter(s => {
    const aspirado = (s.grado_aspirado || s.student_grade || "").trim().toLowerCase();
    const salonActual = (s.student_grade_section || "").trim().toLowerCase();
    const searchTarget = distribucionGrado.trim().toLowerCase();

    const matchesGrade = !searchTarget || aspirado.includes(searchTarget) || aspirado.startsWith(searchTarget);
    
    const term = searchStudent.toLowerCase();
    const matchesSearch = !term || 
      (s.student_name || "").toLowerCase().includes(term) ||
      (s.student_lastname || "").toLowerCase().includes(term) ||
      (s.student_doc || "").toLowerCase().includes(term) ||
      aspirado.includes(term) ||
      salonActual.includes(term);

    return matchesGrade && matchesSearch;
  });

  const handleToggleSelectAll = () => {
    if (selectedStudentDocs.length === studentsToDistribute.length) {
      setSelectedStudentDocs([]);
    } else {
      setSelectedStudentDocs(studentsToDistribute.map(s => s.student_doc));
    }
  };

  const handleToggleStudent = (docId) => {
    setSelectedStudentDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleAssignSelected = async () => {
    if (selectedStudentDocs.length === 0) {
      toast.error("Selecciona al menos un estudiante.");
      return;
    }
    if (!targetClassroom) {
      toast.error("Selecciona el salón destino (ej. 2A, 2B).");
      return;
    }

    setIsAssigning(true);
    try {
      await assignStudentsToClassroom(selectedStudentDocs, targetClassroom);
      toast.success(`${selectedStudentDocs.length} estudiante(s) asignados al salón ${targetClassroom}.`);
      setSelectedStudentDocs([]);
    } catch (err) {
      console.error("Error al asignar estudiantes:", err);
      toast.error("Error al distribuir estudiantes.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-navegación Principal */}
      <div className="flex gap-3 border-b border-gray-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => {
            setActiveSubTab("salones");
            setSelectedClassroomId(null);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "salones"
              ? "bg-Sam text-white shadow-sm"
              : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
          }`}
        >
          🏫 Salones Registrados ({classrooms.length})
        </button>
        <button
          onClick={() => setActiveSubTab("distribucion")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "distribucion"
              ? "bg-Sam text-white shadow-sm"
              : "bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
          }`}
        >
          👥 Distribuidor de Estudiantes por Salón
        </button>
      </div>

      {activeSubTab === "salones" ? (
        /* SECCIÓN 1: GESTIÓN DE SALONES REGISTRADOS */
        <div className="flex flex-col gap-6">
          {!selectedClassroomId ? (
            /* VISTA GENERAL: Tarjetas de Salones con Botón para Crear */
            <>
              <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                      Salones Registrados ({classrooms.length})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Haz clic sobre cualquier salón para consultar su información, editar el director o gestionar sus alumnos.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsCreatingNew(!isCreatingNew)}
                    className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {isCreatingNew ? "Cerrar Formulario" : "Nuevo Salón / Sección"}
                  </button>
                </div>

                {/* Formulario Desplegable para Crear Salón */}
                {isCreatingNew && (
                  <form onSubmit={handleCreateClassroom} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Grado Base *
                      </label>
                      <input
                        type="text"
                        value={gradoBase}
                        onChange={(e) => setGradoBase(e.target.value)}
                        placeholder="Ej. PRIMERO, 2, TRANSICIÓN"
                        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Sección (Opcional)
                      </label>
                      <input
                        type="text"
                        value={seccion}
                        onChange={(e) => setSeccion(e.target.value)}
                        placeholder="Ej. A, B o dejar vacío"
                        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Director de Grupo
                      </label>
                      <select
                        value={selectedProfDoc}
                        onChange={(e) => setSelectedProfDoc(e.target.value)}
                        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                      >
                        <option value="">-- Seleccionar Profesor --</option>
                        {professors.map((p) => (
                          <option key={p.id_documento} value={p.id_documento}>
                            {p.nombre} ({p.id_documento})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreating}
                      className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60 cursor-pointer text-xs"
                    >
                      {isCreating ? "Guardando..." : "Registrar Salón"}
                    </button>
                  </form>
                )}

                {/* Grid de Salones */}
                {isLoading ? (
                  <p className="text-slate-400 text-sm py-4">Cargando salones...</p>
                ) : classrooms.length === 0 ? (
                  <p className="text-slate-400 text-sm italic py-4">
                    No has registrado salones aún. Haz clic en "Nuevo Salón / Sección" para comenzar.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classrooms.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectClassroom(c)}
                        className="p-5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col justify-between hover:border-Sam hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xl font-extrabold text-Sam dark:text-green-400 group-hover:underline">
                                {c.id}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">
                                ({c.nombre_salon})
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteClassroom(c.id, e)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Eliminar salón"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                            Director: <strong>{c.director_nombre || "Sin Asignar"}</strong>
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700/60 flex justify-between items-center">
                          <span className="text-xs font-bold bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 px-2.5 py-0.5 rounded-full">
                            {c.estudiantes_count ?? 0} alumnos
                          </span>
                          <span className="text-xs font-bold text-Sam flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Consultar y Gestionar ➔
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* VISTA DETALLADA: Primero Consulta de Datos + Botón Editar y Botón Mover */
            <div className="flex flex-col gap-6">
              {/* Botón Volver y Eliminar */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setSelectedClassroomId(null)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-Sam flex items-center gap-2 px-4 py-2 border rounded-xl bg-white dark:bg-slate-800 cursor-pointer shadow-sm"
                >
                  ⬅ Volver a la Lista de Salones
                </button>

                <button
                  onClick={(e) => handleDeleteClassroom(selectedClassroom.id, e)}
                  className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 cursor-pointer"
                >
                  Eliminar Salón {selectedClassroom.id}
                </button>
              </div>

              {/* 1. SECCIÓN: DATOS DEL SALÓN (Primero Consulta, luego Edición al dar clic) */}
              <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                {!isEditingClassroomInfo ? (
                  /* MODO CONSULTA DE DATOS DEL SALÓN */
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-extrabold text-Sam font-mono">{selectedClassroom.id}</span>
                        <span className="text-base font-bold text-slate-800 dark:text-white">
                          {selectedClassroom.nombre_salon}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Profesor Director: <strong>{selectedClassroom.director_nombre || "Sin Asignar"}</strong> &bull; Total Asignados: <strong>{studentsInSelectedClassroom.length} estudiantes</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => setIsEditingClassroomInfo(true)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm self-start sm:self-auto"
                    >
                      <svg className="w-4 h-4 text-Sam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar Datos del Salón
                    </button>
                  </div>
                ) : (
                  /* MODO EDICIÓN DE DATOS DEL SALÓN (Al hacer clic en el botón) */
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      ✏️ Editando Salón {selectedClassroom.id}
                    </h3>
                    <form onSubmit={handleSaveClassroomDetails} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre del Salón</label>
                        <input
                          type="text"
                          value={editNombreSalon}
                          onChange={(e) => setEditNombreSalon(e.target.value)}
                          placeholder="Ej. Grado PRIMERO"
                          className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Director de Grupo</label>
                        <select
                          value={editDirectorDoc}
                          onChange={(e) => setEditDirectorDoc(e.target.value)}
                          className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                        >
                          <option value="">-- Sin Asignar --</option>
                          {professors.map((p) => (
                            <option key={p.id_documento} value={p.id_documento}>
                              {p.nombre} ({p.id_documento})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingClassroomInfo(false)}
                          className="w-1/3 py-2.5 bg-gray-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingClassroom}
                          className="w-2/3 py-2.5 bg-Sam hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {isSavingClassroom ? "Guardando..." : "Guardar Cambios"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* 2. SECCIÓN: ESTUDIANTES ASIGNADOS (Primero Consulta + Botón Mover/Reasignar) */}
              <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Estudiantes Asignados ({studentsInSelectedClassroom.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Consulta los alumnos de este salón. Puedes reasignar individualmente o en lote con el botón de mover.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <input
                      type="text"
                      value={searchInClassroom}
                      onChange={(e) => setSearchInClassroom(e.target.value)}
                      placeholder="🔍 Buscar estudiante..."
                      className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full sm:w-64 rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
                    />

                    {selectedClassroomStudentDocs.length > 0 && (
                      <button
                        onClick={() => setIsBatchMoveModalOpen(true)}
                        className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap w-full sm:w-auto justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Mover Seleccionados ({selectedClassroomStudentDocs.length})
                      </button>
                    )}
                  </div>
                </div>

                {studentsInSelectedClassroom.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8 text-center border-2 border-dashed rounded-2xl">
                    No hay estudiantes asignados a este salón actualmente.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-700 text-slate-500">
                          <th className="p-3 w-8">
                            <input
                              type="checkbox"
                              checked={selectedClassroomStudentDocs.length === studentsInSelectedClassroom.length && studentsInSelectedClassroom.length > 0}
                              onChange={() => {
                                if (selectedClassroomStudentDocs.length === studentsInSelectedClassroom.length) {
                                  setSelectedClassroomStudentDocs([]);
                                } else {
                                  setSelectedClassroomStudentDocs(studentsInSelectedClassroom.map(s => s.student_doc));
                                }
                              }}
                              className="rounded accent-Sam cursor-pointer"
                            />
                          </th>
                          <th className="p-3 font-semibold">Documento</th>
                          <th className="p-3 font-semibold">Estudiante</th>
                          <th className="p-3 font-semibold">Acudiente</th>
                          <th className="p-3 font-semibold text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {studentsInSelectedClassroom.map((s) => (
                          <tr key={s.student_doc} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedClassroomStudentDocs.includes(s.student_doc)}
                                onChange={() => {
                                  setSelectedClassroomStudentDocs(prev => 
                                    prev.includes(s.student_doc) ? prev.filter(id => id !== s.student_doc) : [...prev, s.student_doc]
                                  );
                                }}
                                className="rounded accent-Sam cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{s.student_doc}</td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {s.student_name} {s.student_lastname}
                            </td>
                            <td className="p-3 text-slate-500">
                              {s.attendant_name || "Sin acudiente"} &bull; {s.attendant_phone}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setStudentToMove(s);
                                  setTargetMoveClassroom("");
                                }}
                                className="bg-slate-100 hover:bg-Sam hover:text-white dark:bg-slate-700 dark:hover:bg-Sam text-slate-700 dark:text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Mover de Salón
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SECCIÓN 2: DISTRIBUIDOR MASIVO DE ESTUDIANTES */
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-Sam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Distribuidor Masivo de Estudiantes por Salón
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                Filtra alumnos de un grado matriculado y repártelos en sus secciones (ej. de 2º a 2A y 2B).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={distribucionGrado}
                onChange={(e) => setDistribucionGrado(e.target.value)}
                placeholder="Filtrar por Grado Aspirado: Ej. 2, PRIMERO..."
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2 rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
              />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Buscar por nombre o doc..."
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2 rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs"
              />
            </div>
          </div>

          {/* Barra de Asignación */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-Sam hover:underline font-bold cursor-pointer"
              >
                {selectedStudentDocs.length === studentsToDistribute.length && studentsToDistribute.length > 0 
                  ? "Deseleccionar Todos" 
                  : "Seleccionar Todos"}
              </button>
              <span>•</span>
              <span>Seleccionados: <strong>{selectedStudentDocs.length}</strong> de {studentsToDistribute.length}</span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={targetClassroom}
                onChange={(e) => setTargetClassroom(e.target.value)}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2.5 rounded-xl border border-gray-300 dark:border-slate-600 outline-none text-xs font-medium"
              >
                <option value="">-- Salón Destino --</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} ({c.nombre_salon})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAssignSelected}
                disabled={isAssigning || selectedStudentDocs.length === 0}
                className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer text-xs whitespace-nowrap shadow-sm"
              >
                {isAssigning ? "Asignando..." : "Mover / Asignar"}
              </button>
            </div>
          </div>

          {/* Tabla de Estudiantes para Distribución */}
          <div className="overflow-x-auto">
            {studentsToDistribute.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">
                No se encontraron estudiantes{distribucionGrado ? ` para el grado aspirado "${distribucionGrado}"` : ""}.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 text-slate-500">
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedStudentDocs.length === studentsToDistribute.length && studentsToDistribute.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded accent-Sam cursor-pointer"
                      />
                    </th>
                    <th className="p-3 font-semibold">Documento</th>
                    <th className="p-3 font-semibold">Estudiante</th>
                    <th className="p-3 font-semibold">Grado Aspirado (A Cursar)</th>
                    <th className="p-3 font-semibold">Salón Asignado Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {studentsToDistribute.map((s) => {
                    const isSelected = selectedStudentDocs.includes(s.student_doc);
                    return (
                      <tr
                        key={s.student_doc}
                        onClick={() => handleToggleStudent(s.student_doc)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${
                          isSelected ? "bg-green-50/50 dark:bg-green-950/20" : ""
                        }`}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStudent(s.student_doc)}
                            className="rounded accent-Sam cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{s.student_doc}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {s.student_name} {s.student_lastname}
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                            {s.grado_aspirado || s.student_grade || "Sin Definir"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            s.student_grade_section && s.student_grade_section !== "Sin Asignar" && s.student_grade_section !== "SIN ASIGNAR"
                              ? "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                          }`}>
                            {s.student_grade_section && s.student_grade_section !== "Sin Asignar" && s.student_grade_section !== "SIN ASIGNAR" ? s.student_grade_section : "Sin Asignar"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA MOVER ESTUDIANTE INDIVIDUAL */}
      {studentToMove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-Sam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Mover Estudiante de Salón
              </h3>
              <button onClick={() => setStudentToMove(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl mb-4 text-xs space-y-1">
              <p>Estudiante: <strong>{studentToMove.student_name} {studentToMove.student_lastname}</strong></p>
              <p className="text-slate-400">Documento: {studentToMove.student_doc} &bull; Salón Actual: <strong>{selectedClassroom?.id}</strong></p>
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Selecciona el Salón Destino:
              </label>
              <select
                value={targetMoveClassroom}
                onChange={(e) => setTargetMoveClassroom(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-Sam"
              >
                <option value="">-- Seleccionar opción --</option>
                <option value="SIN_ASIGNAR">⚠️ Quitar de este salón (Dejar sin salón)</option>
                {classrooms.filter(c => c.id !== selectedClassroomId).map(c => (
                  <option key={c.id} value={c.id}>Mover al Salón {c.id} ({c.nombre_salon})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStudentToMove(null)}
                className="w-1/3 py-2.5 bg-gray-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveSingleStudent}
                disabled={isMovingStudent || !targetMoveClassroom}
                className="w-2/3 py-2.5 bg-Sam hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isMovingStudent ? "Moviendo..." : "Confirmar Movimiento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA MOVER ESTUDIANTES EN LOTE */}
      {isBatchMoveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-Sam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Mover {selectedClassroomStudentDocs.length} Estudiantes
              </h3>
              <button onClick={() => setIsBatchMoveModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Selecciona el nuevo salón hacia donde deseas transferir a los {selectedClassroomStudentDocs.length} estudiantes seleccionados.
            </p>

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Salón Destino:
              </label>
              <select
                value={targetMoveClassroom}
                onChange={(e) => setTargetMoveClassroom(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-Sam"
              >
                <option value="">-- Seleccionar salón --</option>
                <option value="SIN_ASIGNAR">⚠️ Quitar del salón (Dejar sin salón)</option>
                {classrooms.filter(c => c.id !== selectedClassroomId).map(c => (
                  <option key={c.id} value={c.id}>Salón {c.id} ({c.nombre_salon})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsBatchMoveModalOpen(false)}
                className="w-1/3 py-2.5 bg-gray-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchMove}
                disabled={isMovingStudent || !targetMoveClassroom}
                className="w-2/3 py-2.5 bg-Sam hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isMovingStudent ? "Moviendo..." : "Confirmar Transferencia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
