import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/useAuthStore";

export function AttendanceForm() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gradoFiltro, setGradoFiltro] = useState(user?.director_grupo !== "Ninguno" ? user?.director_grupo : "1A");
  const [fechaAsistencia, setFechaAsistencia] = useState(new Date().toISOString().split("T")[0]);
  
  // Estado para las faltas. id_documento -> estado ('Falta', 'Excusa', 'Retardo', 'Presente')
  const [asistencia, setAsistencia] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(sheetUrl);
      if (!res.ok) throw new Error("Error al obtener estudiantes");
      const data = await res.json();
      
      // Filtrar por el grado seleccionado
      const filtered = data.filter(s => (s.student_grade || "").toLowerCase() === gradoFiltro.toLowerCase());
      
      // Inicializar a todos como presentes
      const inicial = {};
      filtered.forEach(s => {
        inicial[s.student_doc] = "Presente";
      });
      
      setStudents(filtered);
      setAsistencia(inicial);
    } catch (err) {
      toast.error("Error cargando estudiantes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gradoFiltro) {
      fetchStudents();
    }
  }, [gradoFiltro]);

  const handleStatusChange = (doc, status) => {
    setAsistencia(prev => ({ ...prev, [doc]: status }));
  };

  const handleSubmit = async () => {
    // Filtrar solo los que NO están presentes, o mandar todos.
    // Usualmente se guardan las inasistencias o retardos para ahorrar espacio.
    const inasistencias = students.filter(s => asistencia[s.student_doc] !== "Presente");
    
    if (inasistencias.length === 0) {
      toast.success("Todos asistieron. No se registraron faltas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadData = inasistencias.map(s => ({
        fecha: fechaAsistencia,
        student_doc: s.student_doc,
        student_name: `${s.student_name} ${s.student_lastname}`,
        grado: s.student_grade,
        profesor: user?.nombre,
        estado: asistencia[s.student_doc]
      }));

      const payload = { data: payloadData };

      const res = await fetch(`${sheetUrl}?sheet=asistencias`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error guardando la asistencia");
      toast.success("Asistencia registrada exitosamente");
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Control de Asistencia Express</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Grado / Salón</label>
            <input
              type="text"
              value={gradoFiltro}
              onChange={(e) => setGradoFiltro(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 outline-none"
              placeholder="Ej: 5A"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha</label>
            <input
              type="date"
              value={fechaAsistencia}
              onChange={(e) => setFechaAsistencia(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={fetchStudents}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-lg transition-colors w-full"
            >
              Cargar Estudiantes
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-slate-500 my-8">Cargando lista...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-slate-500 my-8">No se encontraron estudiantes para este grado.</p>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Estudiante</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">Presente</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">Falta</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">Excusa</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-center">Retardo</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const status = asistencia[student.student_doc];
                    return (
                      <tr key={student.student_doc} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 text-sm text-slate-800 dark:text-slate-200 font-medium">
                          {student.student_name} {student.student_lastname}
                        </td>
                        <td className="p-3 text-center">
                          <input type="radio" name={`ast_${student.student_doc}`} checked={status === "Presente"} onChange={() => handleStatusChange(student.student_doc, "Presente")} className="w-4 h-4 text-green-600" />
                        </td>
                        <td className="p-3 text-center">
                          <input type="radio" name={`ast_${student.student_doc}`} checked={status === "Falta"} onChange={() => handleStatusChange(student.student_doc, "Falta")} className="w-4 h-4 text-red-600" />
                        </td>
                        <td className="p-3 text-center">
                          <input type="radio" name={`ast_${student.student_doc}`} checked={status === "Excusa"} onChange={() => handleStatusChange(student.student_doc, "Excusa")} className="w-4 h-4 text-blue-600" />
                        </td>
                        <td className="p-3 text-center">
                          <input type="radio" name={`ast_${student.student_doc}`} checked={status === "Retardo"} onChange={() => handleStatusChange(student.student_doc, "Retardo")} className="w-4 h-4 text-orange-600" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-gray-100 dark:border-slate-700 pt-6">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-Sam hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? "Guardando..." : "Guardar Asistencia"}
                {!isSubmitting && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
