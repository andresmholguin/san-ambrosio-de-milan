import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AddAnnotationModal } from "./components/AddAnnotationModal";
import { useAuthStore } from "../../store/useAuthStore";
import { generateStudentReportPDF } from "../../utils/generatePDF";
import { getStudentByDoc } from "../../services/studentService";
import { subscribeToObservations } from "../../services/observationService";
import { getAttendancesByStudent } from "../../services/attendanceService";

export default function StudentProfile() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [student, setStudent] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para el acordeón
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  useEffect(() => {
    let unsubscribeObs = () => {};

    const loadData = async () => {
      setIsLoading(true);
      try {
        const studentData = await getStudentByDoc(id);
        if (!studentData) {
          toast.error("Estudiante no encontrado");
          setIsLoading(false);
          return;
        }
        setStudent(studentData);

        // Cargar inasistencias del estudiante
        const attList = await getAttendancesByStudent(id);
        setAttendances(attList);

        // Suscribirse en tiempo real a las observaciones
        unsubscribeObs = subscribeToObservations(
          id,
          (obsList) => setAnnotations(obsList),
          (err) => console.error("Error al escuchar observaciones:", err)
        );
      } catch (error) {
        console.error("Error al cargar perfil:", error);
        toast.error("Error al cargar perfil del estudiante");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      unsubscribeObs();
    };
  }, [id]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Cargando perfil...</div>;
  }

  if (!student) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Estudiante no encontrado</h2>
        <Link to="/admin" className="text-Sam hover:underline font-bold">Volver al Dashboard</Link>
      </div>
    );
  }

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Felicitación': return 'bg-green-100 text-green-800 border-green-200';
      case 'Disciplinaria': return 'bg-red-100 text-red-800 border-red-200';
      case 'Académica': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Psicológica': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Convivencia': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const visibleAnnotations = annotations.filter(ann => {
    if (ann.privacidad === 'Restringida' && user?.rol !== 'admin') return false;
    return true;
  });

  const handleDownloadPDF = () => {
    try {
      generateStudentReportPDF(student, visibleAnnotations);
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el PDF. Revisa la consola.");
    }
  };

  return (
    <div className="p-6 md:p-12 w-full max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Header Perfil */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-Sam/10 text-Sam rounded-full flex items-center justify-center text-2xl font-bold uppercase">
            {student.student_name?.charAt(0)}{student.student_lastname?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {student.student_name} {student.student_lastname}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Doc: <strong>{student.student_doc}</strong> &bull; Grado Aspirado: <strong className="text-blue-600 dark:text-blue-400">{student.grado_aspirado || student.student_grade || "Sin Definir"}</strong> &bull; Salón Asignado: <strong className="text-green-600 dark:text-green-400">{student.student_grade_section && student.student_grade_section !== "Sin Asignar" ? student.student_grade_section : "Sin Asignar"}</strong>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {user?.rol === 'admin' && (
            <Link 
              to={`/admin/estudiante/${id}/editar`}
              className="bg-Sam hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar Datos
            </Link>
          )}
          <button
            onClick={handleDownloadPDF}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            Descargar PDF
          </button>
          <Link 
            to="/admin" 
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            Volver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Personal */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Información del Estudiante</h3>
          <ul className="space-y-3 text-sm">
            <li><span className="font-semibold text-slate-500 dark:text-slate-400">Grado Aspirado:</span> <span className="font-bold text-blue-600 dark:text-blue-400">{student.grado_aspirado || student.student_grade || "Sin Definir"}</span></li>
            <li><span className="font-semibold text-slate-500 dark:text-slate-400">Salón Asignado:</span> <span className="font-bold text-green-600 dark:text-green-400">{student.student_grade_section && student.student_grade_section !== "Sin Asignar" ? student.student_grade_section : "Sin Asignar"}</span></li>
            <li><span className="font-semibold text-slate-500 dark:text-slate-400">Fecha Nacimiento:</span> <span className="dark:text-slate-200">{student.student_birth}</span></li>
            <li><span className="font-semibold text-slate-500 dark:text-slate-400">Dirección:</span> <span className="dark:text-slate-200">{student.student_address}</span></li>
          </ul>
        </div>

        {/* Info Acudiente */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Acudiente Principal</h3>
          <ul className="space-y-3 text-sm">
            <li><span className="font-semibold text-slate-500 dark:text-slate-400">Nombre:</span> <span className="dark:text-slate-200">{student.attendant_name} {student.attendant_lastname}</span></li>
            <li><span className="font-semibold text-slate-500 dark:text-slate-400">Teléfono:</span> <span className="dark:text-slate-200">{student.attendant_phone}</span></li>
            <li><span className="font-semibold text-slate-500 dark:text-slate-400">Email:</span> <span className="dark:text-slate-200">{student.attendant_email}</span></li>
            <li><span className="font-semibold text-slate-500 dark:text-slate-400">Parentesco:</span> <span className="dark:text-slate-200">{student.attendant_relation || student.attendant_type}</span></li>
          </ul>
        </div>
      </div>

      {/* Acordeón Información Completa */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mt-2">
        <button 
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          className="w-full flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-colors cursor-pointer outline-none"
        >
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-Sam" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Ver base de datos completa de los padres
          </h3>
          <svg className={`w-4 h-4 text-slate-400 transform transition-transform duration-300 ${isInfoExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        {isInfoExpanded && (
          <div className="p-5 border-t border-gray-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in bg-slate-50/20 dark:bg-slate-900/20">
            {/* Info Madre */}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-Sam dark:text-green-400 mb-2 border-b border-gray-200 dark:border-slate-700 pb-1">Datos de la Madre</h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-700 dark:text-slate-300">Nombre:</strong> {student.mother_name} {student.mother_lastname}</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Documento:</strong> {student.mother_doc}</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Teléfono:</strong> {student.mother_phone}</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Email:</strong> {student.mother_email}</li>
              </ul>
            </div>

            {/* Info Padre */}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-Sam dark:text-green-400 mb-2 border-b border-gray-200 dark:border-slate-700 pb-1">Datos del Padre</h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-700 dark:text-slate-300">Nombre:</strong> {student.father_name} {student.father_lastname}</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Documento:</strong> {student.father_doc}</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Teléfono:</strong> {student.father_phone}</li>
                <li><strong className="text-slate-700 dark:text-slate-300">Email:</strong> {student.father_email}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Módulo Observador */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Observador del Estudiante</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadPDF}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-600 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Descargar PDF
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-Sam hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Nueva Anotación
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          {visibleAnnotations.length === 0 ? (
            <div className="text-center text-slate-500 p-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
              Aún no hay anotaciones visibles en el observador de este estudiante.
            </div>
          ) : (
            visibleAnnotations.map((ann) => (
              <div key={ann.id_anotacion} className="p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getCategoryColor(ann.categoria)}`}>
                      {ann.categoria}
                    </span>
                    {ann.privacidad === 'Restringida' && (
                      <span className="text-xs text-red-500 flex items-center gap-1 font-semibold" title="Solo visible para admin/psicología">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Privado
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{ann.fecha}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-3">
                  {ann.descripcion}
                </p>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <span>Registrado por: <strong>{ann.profesor_nombre}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Módulo Historial de Inasistencias y Excusas de Padres */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-Sam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Historial de Inasistencias y Excusas ({attendances.length})
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Registro de faltas, retardos y las respuestas enviadas por los padres/acudientes.
        </p>

        {attendances.length === 0 ? (
          <div className="text-center text-slate-500 p-6 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-xs">
            Este estudiante no tiene inasistencias ni faltas registradas.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {attendances.map((att) => {
              const isJustified = att.justification_status === "Justificada por Acudiente" || att.parent_response;
              return (
                <div 
                  key={att.id} 
                  className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-white font-mono">
                        📅 {att.fecha}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        att.estado === "Falta" 
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300"
                      }`}>
                        {att.estado}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isJustified
                        ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      {isJustified ? "✓ Justificada por Acudiente" : "⏳ Pendiente de Respuesta"}
                    </span>
                  </div>

                  {att.parent_response ? (
                    <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-green-200 dark:border-green-900/40 text-xs space-y-1.5 text-slate-700 dark:text-slate-200">
                      <p>
                        <strong className="text-Sam dark:text-green-400">Motivo:</strong> {att.parent_response.motivo}
                      </p>
                      <p>
                        <strong className="text-slate-500">Explicación del Acudiente:</strong> {att.parent_response.detalle}
                      </p>
                      <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-700/60">
                        <span>Respondido por: <strong>{att.parent_response.parentName}</strong> {att.parent_response.parentPhone && `(${att.parent_response.parentPhone})`}</span>
                        <span>{new Date(att.parent_response.respondedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">
                      Registrado por: {att.profesor}. Notificación enviada al correo del acudiente.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddAnnotationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentDoc={student.student_doc}
        onAnnotationAdded={() => {}}
      />
    </div>
  );
}
