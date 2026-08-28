import { useState, useEffect } from "react";
import { registerPublicTeacher } from "../services/authService";
import { getFormSchema } from "../services/formSchemaService";
import toast, { Toaster } from "react-hot-toast";

export default function TeacherRegistration() {
  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      const data = await getFormSchema("teacher_form");
      if (data) {
        setSchema(data);
        // Inicializar formData con los campos existentes
        const initialData = {};
        data.sections.forEach(sec => {
          sec.elements.forEach(el => {
            if (el.type === "field" && el.id) {
              // Valores por defecto
              initialData[el.id] = el.inputType === 'checkbox' ? false : "";
            }
          });
        });
        setFormData(initialData);
      } else {
        toast.error("El esquema del formulario no fue encontrado.");
      }
    } catch (error) {
      toast.error("Error al cargar la configuración del formulario.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      // Nota: Aquí se debería manejar la subida del archivo a Storage antes de guardar
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Envía todos los datos dinámicos a authService
      await registerPublicTeacher(formData);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al enviar tu solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 dark:bg-slate-900 min-h-screen font-nunito flex items-center justify-center">
        <p className="text-slate-500 font-bold text-lg animate-pulse">Cargando formulario...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-gray-100 dark:bg-slate-900 min-h-screen font-nunito flex flex-col items-center">
        <div className="w-full max-w-2xl px-4 py-12 flex flex-col items-center justify-center mt-20">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4">¡Solicitud Enviada!</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
              Tus datos han sido registrados exitosamente. La administración revisará tu solicitud y activará tu cuenta en breve.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-Sam text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-green-700 transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper para mapear el ancho a clases de Tailwind (Grid de 12 columnas)
  const getColSpanClass = (width) => {
    switch (width) {
      case "1/2": return "col-span-12 md:col-span-6";
      case "1/3": return "col-span-12 md:col-span-4";
      case "2/3": return "col-span-12 md:col-span-8";
      case "full": default: return "col-span-12";
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-slate-900 min-h-screen font-nunito text-slate-800 dark:text-slate-100 pb-16">
      <Toaster position="top-right" />

      <main className="max-w-4xl mx-auto px-4 pt-10">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-slate-700">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-Sam mb-4">{schema?.title || "Registro"}</h1>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              {schema?.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            {schema?.sections?.map((section, idx) => (
              <div key={section.id} className="pt-2">
                
                {/* Título de Sección */}
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <span className="bg-Sam text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
                    {idx + 1}
                  </span>
                  {section.title}
                </h2>

                {/* Grid Container */}
                <div className="grid grid-cols-12 gap-6">
                  {section.elements.map((el, elIdx) => {
                    
                    if (el.type === "divider") {
                      return (
                        <div key={elIdx} className="col-span-12 my-2 border-t border-gray-200 dark:border-slate-700"></div>
                      );
                    }

                    if (el.type === "button") {
                      return (
                        <div key={elIdx} className="col-span-12 flex justify-center my-2">
                          <a href={el.actionUrl || "#"} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                            {el.label}
                          </a>
                        </div>
                      );
                    }

                    if (!el.visible) return null;

                    // Si es Field
                    return (
                      <div key={el.id} className={getColSpanClass(el.width)}>
                        {el.inputType === "checkbox" ? (
                          <div 
                            className="flex items-start gap-3 mt-2 p-4 rounded-2xl border-2 border-dashed hover:opacity-90 transition-opacity"
                            style={{ 
                              backgroundColor: `color-mix(in srgb, ${el.checkboxColor || '#0e704d'} 10%, white)`,
                              borderColor: `color-mix(in srgb, ${el.checkboxColor || '#0e704d'} 50%, transparent)` 
                            }}
                          >
                            <div className="flex h-6 items-center">
                              <input
                                type="checkbox"
                                name={el.id}
                                checked={formData[el.id] || false}
                                onChange={handleChange}
                                required={el.required}
                                className="w-5 h-5 cursor-pointer"
                                style={{ accentColor: el.checkboxColor || '#0e704d' }}
                              />
                            </div>
                            <div className="flex flex-col">
                              <label 
                                className="text-sm font-extrabold cursor-pointer" 
                                style={{ color: el.checkboxColor || '#0e704d' }}
                                onClick={() => setFormData(prev => ({ ...prev, [el.id]: !prev[el.id] }))}
                              >
                                {el.label} {el.required && <span className="text-red-500">*</span>}
                              </label>
                              {el.helpText && (
                                <p 
                                  className="text-xs mt-1 cursor-pointer opacity-80" 
                                  style={{ color: el.checkboxColor || '#0e704d' }}
                                  onClick={() => setFormData(prev => ({ ...prev, [el.id]: !prev[el.id] }))}
                                >
                                  {el.helpText}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                              {el.label} {el.required && <span className="text-red-500">*</span>}
                            </label>
                            {el.helpText && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 leading-tight">
                                {el.helpText}
                              </p>
                            )}
                            
                            {el.inputType === "textarea" ? (
                              <textarea
                                name={el.id}
                                required={el.required}
                                value={formData[el.id] || ""}
                                onChange={handleChange}
                                placeholder={el.placeholder || ""}
                                rows="3"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-Sam/50 transition-all text-sm"
                              ></textarea>
                            ) : el.inputType === "select" ? (
                              <select
                                name={el.id}
                                required={el.required}
                                value={formData[el.id] || ""}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-Sam/50 transition-all text-sm appearance-none font-semibold"
                              >
                                <option value="" disabled>Seleccionar {el.label}...</option>
                                {el.options?.split(',').map((opt, i) => (
                                  <option key={i} value={opt.trim()}>{opt.trim()}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={el.inputType}
                                name={el.id}
                                required={el.required}
                                value={formData[el.id] || ""}
                                onChange={handleChange}
                                placeholder={el.placeholder || ""}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-Sam/50 transition-all text-sm"
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-8 text-center border-t border-gray-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto bg-Sam hover:bg-green-800 text-white px-10 py-4 rounded-full font-bold shadow-lg disabled:opacity-70 transition-all flex items-center justify-center gap-2 mx-auto"
              >
                {isSubmitting ? (
                  "Procesando solicitud..."
                ) : (
                  <>
                    {schema?.submitText || "Enviar Formulario"}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
