import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/useAuthStore";
import { addObservation } from "../../../services/observationService";

export function AddAnnotationModal({ isOpen, onClose, studentDoc, onAnnotationAdded }) {
  const { user } = useAuthStore();
  const [categoria, setCategoria] = useState("Académica");
  const [descripcion, setDescripcion] = useState("");
  const [privacidad, setPrivacidad] = useState("Pública");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      toast.error("La descripción no puede estar vacía");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const dateStr = now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(now.getDate()).padStart(2, '0') + ' ' + 
                      String(now.getHours()).padStart(2, '0') + ':' + 
                      String(now.getMinutes()).padStart(2, '0');

      await addObservation({
        student_doc: studentDoc,
        profesor_doc: user?.id_documento || "",
        profesor_nombre: user?.nombre || "Docente",
        fecha: dateStr,
        categoria,
        descripcion: descripcion.trim(),
        privacidad
      });

      toast.success("Anotación guardada exitosamente");
      setDescripcion("");
      setCategoria("Académica");
      setPrivacidad("Pública");
      if (onAnnotationAdded) onAnnotationAdded();
      onClose();
    } catch (error) {
      console.error("Error al guardar anotación:", error);
      toast.error(error.message || "Error al conectar con la base de datos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 border border-gray-100 dark:border-slate-700/50 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-6">
          Nueva Anotación
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
              >
                <option value="Académica">Académica</option>
                <option value="Disciplinaria">Disciplinaria</option>
                <option value="Convivencia">Convivencia</option>
                <option value="Psicológica">Psicológica (Privada)</option>
                <option value="Felicitación">Felicitación</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Nivel de Privacidad</label>
              <select
                value={privacidad}
                onChange={(e) => setPrivacidad(e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
              >
                <option value="Pública">Pública (Profesores y Admin)</option>
                <option value="Restringida">Restringida (Solo Admin y Psicología)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Descripción / Observación</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows="4"
              className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none resize-none"
              placeholder="Escribe los detalles de la anotación aquí..."
              required
            ></textarea>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-Sam hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {isSubmitting ? "Guardando..." : "Guardar Anotación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
