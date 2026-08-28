import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { subscribeToStudents, saveStudent } from "../../../services/studentService";
import { subscribeToClassrooms } from "../../../services/classroomService";
import { useAuthStore } from "../../../store/useAuthStore";
import { exportToExcel } from "../../../utils/exportExcel";
import toast from "react-hot-toast";

export function StudentsList() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal nuevo estudiante
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState("");
  const [newName, setNewName] = useState("");
  const [newLastname, setNewLastname] = useState("");
  const [newGradoAspirado, setNewGradoAspirado] = useState("PRIMERO");
  const [newGradeSection, setNewGradeSection] = useState("Sin Asignar");
  const [newAttendant, setNewAttendant] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubStudents = subscribeToStudents(
      (data) => {
        setStudents(data);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error cargando estudiantes:", err);
        toast.error("No se pudieron cargar los estudiantes de Firestore");
        setIsLoading(false);
      }
    );

    const unsubClassrooms = subscribeToClassrooms((classList) => {
      setClassrooms(classList);
    });

    return () => {
      unsubStudents();
      unsubClassrooms();
    };
  }, []);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newDoc.trim() || !newName.trim() || !newLastname.trim()) {
      toast.error("Documento, nombres y apellidos son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await saveStudent({
        student_doc: newDoc.trim(),
        student_name: newName.trim().toUpperCase(),
        student_lastname: newLastname.trim().toUpperCase(),
        grado_aspirado: newGradoAspirado.trim().toUpperCase(),
        student_grade: (newGradeSection && newGradeSection !== "Sin Asignar" ? newGradeSection : "Sin Asignar").toUpperCase(),
        student_grade_section: (newGradeSection && newGradeSection !== "Sin Asignar" ? newGradeSection : "Sin Asignar").toUpperCase(),
        attendant_name: newAttendant.trim().toUpperCase(),
        attendant_phone: newPhone.trim(),
        attendant_email: newEmail.trim()
      });

      toast.success("Estudiante registrado exitosamente.");
      setIsModalOpen(false);
      setNewDoc("");
      setNewName("");
      setNewLastname("");
      setNewGradoAspirado("PRIMERO");
      setNewGradeSection("Sin Asignar");
      setNewAttendant("");
      setNewPhone("");
      setNewEmail("");
    } catch (err) {
      console.error("Error al crear estudiante:", err);
      toast.error(err.message || "Error al crear estudiante.");
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculo de conteo de estudiantes por salón asignado
  const getCountForClassroom = (classroomId) => {
    const cleanTarget = String(classroomId).trim().toUpperCase();
    return students.filter(s => {
      const gSec = (s.student_grade_section || "").trim().toUpperCase();
      return gSec === cleanTarget;
    }).length;
  };

  const unassignedCount = students.filter(s => {
    const gSec = (s.student_grade_section || "").trim().toUpperCase();
    return !gSec || gSec === "SIN ASIGNAR";
  }).length;

  // Filtrado de estudiantes
  const filteredStudents = students.filter((s) => {
    const studentSalon = (s.student_grade_section || "").trim().toUpperCase();
    const studentAspirado = (s.grado_aspirado || s.student_grade || "").trim().toUpperCase();

    // Filtro por Salón
    if (selectedGradeFilter !== "TODOS") {
      if (selectedGradeFilter === "SIN_ASIGNAR") {
        if (studentSalon && studentSalon !== "SIN ASIGNAR") return false;
      } else {
        if (studentSalon !== selectedGradeFilter) return false;
      }
    }

    // Filtro por término de búsqueda (nombre, documento, grado aspirado o salón)
    const term = searchTerm.toLowerCase();
    const docMatch = (s.student_doc || "").toLowerCase().includes(term);
    const nameMatch = `${s.student_name} ${s.student_lastname}`.toLowerCase().includes(term);
    const aspiradoMatch = studentAspirado.toLowerCase().includes(term);
    const salonMatch = studentSalon.toLowerCase().includes(term);
    return docMatch || nameMatch || aspiradoMatch || salonMatch;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGradeFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const dataToExport = filteredStudents.map(s => ({
      "Documento": s.student_doc,
      "Nombres": s.student_name,
      "Apellidos": s.student_lastname,
      "Grado Aspirado": s.grado_aspirado || s.student_grade || "Sin Definir",
      "Salón Asignado": s.student_grade_section || "Sin Asignar",
      "Acudiente Principal": s.attendant_name ? `${s.attendant_name} ${s.attendant_lastname}` : "No definido",
      "Teléfono Acudiente": s.attendant_phone || "",
      "Estado": s.estado || "Activo"
    }));
    
    exportToExcel(dataToExport, `Listado_Estudiantes_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. SECCIÓN DE SALONES Y GRADOS PARA FILTRADO RÁPIDO */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-Sam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Filtrar por Salón / Grado
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Haz clic en cualquier salón para filtrar la lista de estudiantes al instante.
            </p>
          </div>

          {selectedGradeFilter !== "TODOS" && (
            <button
              onClick={() => setSelectedGradeFilter("TODOS")}
              className="text-xs font-bold text-Sam hover:underline cursor-pointer"
            >
              Mostrar Todos ({students.length})
            </button>
          )}
        </div>

        {/* Tarjetas de Salones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Opción: Todos los Salones */}
          <button
            onClick={() => setSelectedGradeFilter("TODOS")}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedGradeFilter === "TODOS"
                ? "bg-Sam text-white border-Sam shadow-md ring-2 ring-Sam/20"
                : "bg-slate-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-Sam/50"
            }`}
          >
            <span className="font-extrabold text-sm block">Todos</span>
            <span className="text-[11px] opacity-80 mt-1 block">Todos los grados</span>
            <span className={`mt-2 text-xs font-bold px-2 py-0.5 rounded-full inline-block w-fit ${
              selectedGradeFilter === "TODOS" ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {students.length} alumnos
            </span>
          </button>

          {/* Tarjetas por Salón Registrado */}
          {classrooms.map((c) => {
            const isSelected = selectedGradeFilter === c.id;
            const count = getCountForClassroom(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedGradeFilter(c.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-Sam text-white border-Sam shadow-md ring-2 ring-Sam/20"
                    : "bg-slate-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-Sam/50"
                }`}
              >
                <div>
                  <span className="font-extrabold text-sm block truncate">{c.id}</span>
                  <span className="text-[10px] opacity-75 truncate block mt-0.5" title={c.director_nombre}>
                    {c.director_nombre || "Sin Director"}
                  </span>
                </div>
                <span className={`mt-2 text-xs font-bold px-2 py-0.5 rounded-full inline-block w-fit ${
                  isSelected ? "bg-white/20 text-white" : "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300"
                }`}>
                  {count} alumnos
                </span>
              </button>
            );
          })}

          {/* Opción: Sin Asignar */}
          {unassignedCount > 0 && (
            <button
              onClick={() => setSelectedGradeFilter("SIN_ASIGNAR")}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedGradeFilter === "SIN_ASIGNAR"
                  ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20"
                  : "bg-slate-50 dark:bg-slate-900/50 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 hover:border-amber-500"
              }`}
            >
              <span className="font-extrabold text-xs block truncate">Sin Salón</span>
              <span className="text-[10px] opacity-75 block mt-0.5">Pendientes</span>
              <span className={`mt-2 text-xs font-bold px-2 py-0.5 rounded-full inline-block w-fit ${
                selectedGradeFilter === "SIN_ASIGNAR" ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300"
              }`}>
                {unassignedCount} alumnos
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SECCIÓN DEL DIRECTORIO DE ESTUDIANTES */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Directorio de Estudiantes
              {selectedGradeFilter !== "TODOS" && (
                <span className="bg-Sam/10 text-Sam px-3 py-0.5 rounded-full text-xs font-bold">
                  Salón: {selectedGradeFilter}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mostrando {filteredStudents.length} de {students.length} estudiantes matriculados
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por documento, nombre o grado..."
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full md:w-64 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-xs"
            />
            <button
              onClick={handleExport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs whitespace-nowrap cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            {user?.rol === "admin" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs whitespace-nowrap cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Estudiante
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="text-slate-500 text-sm py-4">Cargando estudiantes...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">
              No hay estudiantes que coincidan con el salón o filtro seleccionado.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  <th className="p-3 font-semibold">Documento</th>
                  <th className="p-3 font-semibold">Estudiante</th>
                  <th className="p-3 font-semibold">Grado Aspirado</th>
                  <th className="p-3 font-semibold">Salón Asignado</th>
                  <th className="p-3 font-semibold">Acudiente Principal</th>
                  <th className="p-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {paginatedStudents.map((student, idx) => (
                  <tr key={student.student_doc || idx} className="text-xs hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{student.student_doc}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {student.student_name} {student.student_lastname}
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                        {student.grado_aspirado || student.student_grade || "Sin Definir"}
                      </span>
                    </td>
                    <td className="p-3">
                      {student.student_grade_section && student.student_grade_section !== "Sin Asignar" && student.student_grade_section !== "SIN ASIGNAR" ? (
                        <span className="bg-Sam/20 text-Sam px-2 py-0.5 rounded text-[11px] font-bold">
                          {student.student_grade_section}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sin Asignar</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 capitalize">
                      {student.attendant_name ? `${student.attendant_name} ${student.attendant_lastname}` : "No definido"}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/admin/estudiante/${student.student_doc}`}
                        className="text-Sam hover:text-green-700 font-bold px-3 py-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 transition-colors inline-block"
                      >
                        Ver Perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Controles de Paginación */}
        {!isLoading && filteredStudents.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuevo Estudiante */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 border border-gray-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Registrar Nuevo Estudiante</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">Documento / ID *</label>
                  <input
                    type="text"
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    placeholder="Ej. 11120381218"
                    className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">Grado Aspirado (A Cursar) *</label>
                  <input
                    type="text"
                    value={newGradoAspirado}
                    onChange={(e) => setNewGradoAspirado(e.target.value)}
                    placeholder="Ej. PRIMERO o 2"
                    className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">Salón Asignado</label>
                  <select
                    value={newGradeSection}
                    onChange={(e) => setNewGradeSection(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                  >
                    <option value="Sin Asignar">Sin Asignar (Pendiente)</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.id} ({c.director_nombre})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">Nombres *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej. Juan Carlos"
                    className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    value={newLastname}
                    onChange={(e) => setNewLastname(e.target.value)}
                    placeholder="Ej. Pérez Gómez"
                    className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Datos del Acudiente</p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="font-semibold text-slate-500 block mb-1">Nombre Acudiente</label>
                    <input
                      type="text"
                      value={newAttendant}
                      onChange={(e) => setNewAttendant(e.target.value)}
                      placeholder="Ej. María Gómez"
                      className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-500 block mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="Ej. 3001234567"
                        className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-500 block mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Ej. acudiente@correo.com"
                        className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-2.5 bg-gray-200 dark:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-2/3 py-2.5 bg-Sam hover:bg-green-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {isSaving ? "Guardando..." : "Registrar Estudiante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
