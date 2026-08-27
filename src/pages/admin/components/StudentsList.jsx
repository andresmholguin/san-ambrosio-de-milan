import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export function StudentsList() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // Buscar en la hoja por defecto (donde caen las actualizaciones)
      const res = await fetch(sheetUrl);
      if (!res.ok) throw new Error("Error al obtener estudiantes");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      toast.error("No se pudieron cargar los estudiantes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const docMatch = (s.student_doc || "").toLowerCase().includes(term);
    const nameMatch = `${s.student_name} ${s.student_lastname}`.toLowerCase().includes(term);
    const gradeMatch = (s.student_grade || "").toLowerCase().includes(term);
    return docMatch || nameMatch || gradeMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Directorio de Estudiantes</h2>
          <div className="w-full md:w-1/3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por documento, nombre o grado..."
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="text-slate-500">Cargando...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-slate-500">No hay estudiantes que coincidan con la búsqueda.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Documento</th>
                  <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Estudiante</th>
                  <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Grado</th>
                  <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Acudiente Principal</th>
                  <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr key={student.student_doc || idx} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="p-3 text-sm text-slate-800 dark:text-slate-200">{student.student_doc}</td>
                    <td className="p-3 text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {student.student_name} {student.student_lastname}
                    </td>
                    <td className="p-3 text-sm text-slate-800 dark:text-slate-200">{student.student_grade}</td>
                    <td className="p-3 text-sm text-slate-800 dark:text-slate-200">
                      {student.attendant_name} {student.attendant_lastname} <br/>
                      <span className="text-xs text-slate-500">{student.attendant_phone}</span>
                    </td>
                    <td className="p-3 text-sm">
                      <Link 
                        to={`/admin/estudiante/${student.student_doc}`}
                        className="text-Sam hover:text-green-700 font-semibold cursor-pointer underline"
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
      </div>
    </div>
  );
}
