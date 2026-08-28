import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getAttendanceByToken, submitJustification } from "../services/attendanceService";

export default function JustifyAbsence() {
  const { token } = useParams();
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [motivo, setMotivo] = useState("Incapacidad Médica / Salud");
  const [detalle, setDetalle] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  useEffect(() => {
    const fetchRecord = async () => {
      setIsLoading(true);
      try {
        const data = await getAttendanceByToken(token);
        if (data) {
          setRecord(data);
          if (data.justification_status === "Justificada por Acudiente") {
            setIsSuccess(true);
          }
        }
      } catch (err) {
        console.error("Error al cargar registro:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecord();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!detalle.trim()) {
      toast.error("Por favor ingresa una breve explicación de la inasistencia.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitJustification({
        token,
        motivo,
        detalle: detalle.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim()
      });

      toast.success("¡Justificación enviada correctamente!");
      setIsSuccess(true);
    } catch (err) {
      console.error("Error enviando justificación:", err);
      toast.error(err.message || "Error al enviar la justificación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 md:p-8">
      <Toaster position="top-center" />

      {/* Header Institucional */}
      <div className="max-w-xl mx-auto w-full text-center my-6">
        <img className="size-16 mx-auto mb-2" src="/SAM.svg" alt="Logo Colegio" />
        <h1 className="text-2xl font-bold text-Sam dark:text-green-400">
          Colegio San Ambrosio de Milán
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
          Portal de Justificación de Inasistencias
        </p>
      </div>

      {/* Tarjeta Principal */}
      <div className="max-w-xl mx-auto w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700/60 p-6 md:p-8">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Cargando información de la inasistencia...
          </div>
        ) : !record ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto text-red-500 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Enlace no válido o caducado</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No encontramos el registro de inasistencia asociado a este enlace. Si necesitas ayuda, por favor comunícate directamente con la secretaría del colegio.
            </p>
          </div>
        ) : isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto text-green-600 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              ¡Inasistencia Justificada!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              La justificación para <strong>{record.student_name}</strong> correspondiente al día <strong>{record.fecha}</strong> ha sido recibida y registrada exitosamente en el sistema del colegio.
            </p>

            {record.parent_response && (
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl text-left text-xs border border-gray-200 dark:border-slate-700 space-y-1 text-slate-600 dark:text-slate-400">
                <p><strong>Motivo:</strong> {record.parent_response.motivo}</p>
                <p><strong>Detalle:</strong> {record.parent_response.detalle}</p>
                <p><strong>Registrado por:</strong> {record.parent_response.parentName || "Acudiente"}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Resumen de la inasistencia */}
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-bold text-sm mb-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reporte de Inasistencia
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-400">Estudiante:</span> <strong>{record.student_name}</strong></div>
                <div><span className="text-slate-400">Documento:</span> <strong>{record.student_doc}</strong></div>
                <div><span className="text-slate-400">Grado / Salón:</span> <strong>{record.grado}</strong></div>
                <div><span className="text-slate-400">Fecha de Falta:</span> <strong>{record.fecha}</strong></div>
              </div>
            </div>

            {/* Formulario de Respuesta del Padre */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Nombre de quien justifica (Padre / Madre / Acudiente)
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Ej. Carlos Martínez"
                  className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="Ej. 3001234567"
                  className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Motivo Principal de la Inasistencia
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-sm"
                >
                  <option value="Incapacidad Médica / Salud">Incapacidad Médica / Salud</option>
                  <option value="Cita Médica / Odontológica">Cita Médica / Odontológica</option>
                  <option value="Calamidad Doméstica">Calamidad Doméstica</option>
                  <option value="Motivos de Viaje / Permiso Familiar">Motivos de Viaje / Permiso Familiar</option>
                  <option value="Fuerza Mayor / Transporte">Fuerza Mayor / Transporte</option>
                  <option value="Otro Motivo">Otro Motivo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Explicación o Detalle de la Falta
                </label>
                <textarea
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  rows="4"
                  placeholder="Por favor describa el motivo de la inasistencia..."
                  className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none text-sm resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 bg-Sam hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors w-full disabled:opacity-60 cursor-pointer shadow-md"
              >
                {isSubmitting ? "Enviando Justificación..." : "Enviar Justificación al Colegio"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 mt-6">
        Colegio San Ambrosio de Milán &bull; Sistema de Acompañamiento Escolar
      </div>
    </div>
  );
}
