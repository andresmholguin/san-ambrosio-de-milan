import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function ProfessorsList() {
  const [professors, setProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [directorGrupo, setDirectorGrupo] = useState("");

  const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;

  const fetchProfessors = async () => {
    setIsLoading(true);
    try {
      // Buscar todos los usuarios con rol profesor
      const res = await fetch(`${sheetUrl}/search?rol=profesor&sheet=users`);
      if (!res.ok) throw new Error("Error al obtener profesores");
      const data = await res.json();
      setProfessors(data);
    } catch (err) {
      toast.error("No se pudieron cargar los profesores");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  const handleAddProfessor = async (e) => {
    e.preventDefault();
    if (!documento || !nombre || !directorGrupo) return;

    setIsSubmitting(true);
    try {
      // Validar si ya existe
      const checkRes = await fetch(`${sheetUrl}/search?id_documento=${documento}&sheet=users`);
      const checkData = await checkRes.json();
      if (checkData && checkData.length > 0) {
        toast.error("Este documento ya está registrado.");
        setIsSubmitting(false);
        return;
      }

      // Crear nuevo profesor
      const payload = {
        data: [
          {
            id_documento: documento,
            nombre: nombre.toUpperCase(),
            rol: "profesor",
            director_grupo: directorGrupo,
            password_hash: "",
            estado: "Activo",
            primer_ingreso: "true"
          }
        ]
      };

      const res = await fetch(`${sheetUrl}?sheet=users`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error al guardar en Sheets");

      toast.success("Profesor registrado exitosamente");
      setDocumento("");
      setNombre("");
      setDirectorGrupo("");
      fetchProfessors(); // Recargar la lista
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Formulario Crear */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Registrar Nuevo Profesor</h2>
        <form onSubmit={handleAddProfessor} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Documento</label>
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
              placeholder="Ej. 10203040"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Director de Grupo</label>
            <input
              type="text"
              value={directorGrupo}
              onChange={(e) => setDirectorGrupo(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
              placeholder="Ej. 5A o Ninguno"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-Sam hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70"
          >
            {isSubmitting ? "Guardando..." : "Crear Profesor"}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Directorio de Profesores</h2>
        {isLoading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : professors.length === 0 ? (
          <p className="text-slate-500">No hay profesores registrados.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Documento</th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Director de Grupo</th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Estado</th>
              </tr>
            </thead>
            <tbody>
              {professors.map((prof) => (
                <tr key={prof.id_documento} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="p-3 text-sm text-slate-800 dark:text-slate-200">{prof.id_documento}</td>
                  <td className="p-3 text-sm text-slate-800 dark:text-slate-200 font-medium">{prof.nombre}</td>
                  <td className="p-3 text-sm text-slate-800 dark:text-slate-200">{prof.director_grupo}</td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${prof.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {prof.estado || "Activo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
