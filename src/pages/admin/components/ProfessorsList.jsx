import { useState, useEffect } from "react";
import { 
  subscribeToAllStaff, 
  registerStaff, 
  updateStaff, 
  deleteStaff, 
  resetStaffPassword 
} from "../../../services/authService";
import toast from "react-hot-toast";

export function ProfessorsList() {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form crear nuevo
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("profesor");

  // Modal editar
  const [editingStaff, setEditingStaff] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editRol, setEditRol] = useState("profesor");
  const [editEstado, setEditEstado] = useState("Activo");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAllStaff(
      (data) => {
        setStaffList(data);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error cargando personal:", err);
        toast.error("No se pudo cargar la lista de personal.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!documento.trim() || !nombre.trim()) {
      toast.error("Documento y nombre son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerStaff({
        id_documento: documento.trim(),
        nombre: nombre.trim(),
        rol: rol,
        director_grupo: "Ninguno"
      });

      toast.success("Docente / Administrativo registrado exitosamente.");
      setDocumento("");
      setNombre("");
      setRol("profesor");
    } catch (err) {
      console.error("Error registrando personal:", err);
      toast.error(err.message || "Error al registrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setEditNombre(staff.nombre || "");
    setEditRol(staff.rol || "profesor");
    setEditEstado(staff.estado || "Activo");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsSavingEdit(true);
    try {
      await updateStaff(editingStaff.id_documento || editingStaff.id, {
        nombre: editNombre.trim(),
        rol: editRol,
        estado: editEstado
      });

      toast.success("Datos de usuario actualizados.");
      setEditingStaff(null);
    } catch (err) {
      console.error("Error al actualizar personal:", err);
      toast.error("Error al guardar cambios.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetPassword = async (docId, staffName) => {
    if (!window.confirm(`¿Deseas restablecer la contraseña de ${staffName}? En su próximo inicio de sesión se le pedirá crear una nueva contraseña.`)) {
      return;
    }

    try {
      await resetStaffPassword(docId);
      toast.success(`Contraseña de ${staffName} restablecida.`);
    } catch (err) {
      console.error("Error al restablecer contraseña:", err);
      toast.error("Error al restablecer contraseña.");
    }
  };

  const handleDeleteStaff = async (docId, staffName) => {
    if (!window.confirm(`¿Estás completamente seguro de eliminar a ${staffName} (${docId}) del sistema? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteStaff(docId);
      toast.success("Usuario eliminado del sistema.");
    } catch (err) {
      console.error("Error al eliminar personal:", err);
      toast.error("Error al eliminar usuario.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Formulario Crear */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-Sam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Registrar Nuevo Personal Docente / Administrativo
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Crea cuentas de acceso para docentes o administradores del colegio. La asignación de dirección de grupo se realiza desde la pestaña <strong>Salones y Distribución</strong>.
        </p>

        <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Documento / ID *</label>
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-xs"
              placeholder="Ej. 10203040"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Nombre Completo *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-xs"
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-xs"
            >
              <option value="profesor">Profesor / Docente</option>
              <option value="admin">Administrador / Directivo</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-70 text-xs cursor-pointer shadow-sm"
          >
            {isSubmitting ? "Creando..." : "Crear Usuario"}
          </button>
        </form>
      </div>

      {/* Directorio de Personal */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          Directorio del Personal ({staffList.length})
        </h2>
        {isLoading ? (
          <p className="text-slate-500 text-sm">Cargando personal...</p>
        ) : staffList.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay usuarios registrados.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <th className="p-3 font-semibold">Documento</th>
                <th className="p-3 font-semibold">Nombre</th>
                <th className="p-3 font-semibold">Rol</th>
                <th className="p-3 font-semibold">Salón Asignado (Director)</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {staffList.map((st) => (
                <tr key={st.id_documento || st.id} className="text-xs hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{st.id_documento || st.id}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{st.nombre}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      st.rol === "admin" 
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    }`}>
                      {st.rol === "admin" ? "Administrador" : "Docente"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                    {st.director_grupo && st.director_grupo !== "Ninguno" ? (
                      <span className="bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        {st.director_grupo}
                      </span>
                    ) : (
                      <span className="text-slate-400">Sin Salón</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      st.estado === "Inactivo"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        : st.estado === "pendiente"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                    }`}>
                      {st.estado === "pendiente" ? "Pendiente" : (st.estado || "Activo")}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(st)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                      >
                        Editar
                      </button>
                      <span>&bull;</span>
                      <button
                        onClick={() => handleResetPassword(st.id_documento || st.id, st.nombre)}
                        className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                        title="Forzar creación de nueva contraseña"
                      >
                        Reset Clave
                      </button>
                      <span>&bull;</span>
                      <button
                        onClick={() => handleDeleteStaff(st.id_documento || st.id, st.nombre)}
                        className="text-red-500 hover:underline font-bold cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Editar Personal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-gray-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Editar Personal: {editingStaff.nombre}
              </h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Rol</label>
                <select
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value)}
                  className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                >
                  <option value="no_asignado">-- Pendiente de Asignar --</option>
                  <option value="profesor">Profesor / Docente</option>
                  <option value="admin">Administrador / Directivo</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500">
                <span className="block font-semibold mb-0.5">Director de Grupo:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {editingStaff.director_grupo && editingStaff.director_grupo !== "Ninguno" ? editingStaff.director_grupo : "Sin Salón Asignado"}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  (La asignación de salones se administra desde la pestaña <em>Salones y Distribución</em>).
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Estado de la Cuenta</label>
                <select
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value)}
                  className="p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl w-full outline-none"
                >
                  <option value="pendiente">Pendiente de Aprobación</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo (Bloquear Acceso)</option>
                </select>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="w-1/3 py-2.5 bg-gray-200 dark:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="w-2/3 py-2.5 bg-Sam hover:bg-green-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {isSavingEdit ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
