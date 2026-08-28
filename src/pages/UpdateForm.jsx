import { useState, useEffect } from "react";
import { getFormSchema } from "../services/formSchemaService";
import { saveStudent } from "../services/studentService";
import toast, { Toaster } from "react-hot-toast";

export default function UpdateForm() {
  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({});
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(0); // Index de la sección actual

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      const data = await getFormSchema("student_form");
      if (data) {
        setSchema(data);
        const initialData = {};
        data.sections.forEach(sec => {
          sec.elements.forEach(el => {
            if (el.type === "field" && el.id) {
              initialData[el.id] = el.inputType === 'checkbox' ? false : "";
            }
          });
        });
        setFormData(initialData);
      } else {
        toast.error("El esquema del formulario de estudiantes no fue encontrado.");
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
      setFormData(prev => {
        const newData = { ...prev, [name]: checked };
        // Autofill logic for same address
        if (checked) {
          if (name === "padre_misma_direccion") {
            newData.padre_direccion = prev.estudiante_direccion || "";
            newData.padre_barrio = prev.estudiante_barrio || "";
          }
          if (name === "madre_misma_direccion") {
            newData.madre_direccion = prev.estudiante_direccion || "";
            newData.madre_barrio = prev.estudiante_barrio || "";
          }
        }
        return newData;
      });
    } else if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleParentescoSelect = (role) => {
    setFormData(prev => {
      const newData = { ...prev, acudiente_parentesco: role };
      if (role === "Madre") {
        newData.acudiente_nombre = prev.madre_nombre || "";
        newData.acudiente_documento = prev.madre_documento || "";
        newData.acudiente_celular = prev.madre_celular || "";
        newData.acudiente_email = prev.madre_email || "";
      } else if (role === "Padre") {
        newData.acudiente_nombre = prev.padre_nombre || "";
        newData.acudiente_documento = prev.padre_documento || "";
        newData.acudiente_celular = prev.padre_celular || "";
        newData.acudiente_email = prev.padre_email || "";
      } else {
        // Clear if "Otro"
        newData.acudiente_nombre = "";
        newData.acudiente_documento = "";
        newData.acudiente_celular = "";
        newData.acudiente_email = "";
      }
      return newData;
    });
  };

  const handleNext = () => {
    // Aquí se podría implementar validación HTML5 manual si se desea antes de avanzar
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Guardar usando el servicio existente de estudiantes
      // Nota: El servicio anterior guardaba en estructura anidada { student: {}, father: {} }
      // Ahora lo enviamos todo plano, debes actualizar studentService o la tabla si es necesario
      await saveStudent(formData);
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
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4">¡Registro Exitoso!</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
              Los datos del estudiante han sido guardados correctamente en la base de datos.
            </p>
            <button onClick={() => window.location.href = '/'} className="bg-Sam text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-green-700 transition-colors">
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getColSpanClass = (width) => {
    switch (width) {
      case "1/2": return "col-span-12 md:col-span-6";
      case "1/3": return "col-span-12 md:col-span-4";
      case "2/3": return "col-span-12 md:col-span-8";
      case "full": default: return "col-span-12";
    }
  };

  const isMultiStep = schema?.layoutStyle === "multi_step";
  
  // Renderiza una sola sección (caja)
  const renderSection = (section, idx) => (
    <div key={section.id} className="pt-2 mb-10">
      <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-3">
        <span className="bg-Sam text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
          {isMultiStep ? currentStep + 1 : idx + 1}
        </span>
        {section.title}
      </h2>

      <div className="grid grid-cols-12 gap-6">
        {section.elements.map((el, elIdx) => {
          if (el.type === "divider") return <div key={elIdx} className="col-span-12 my-2 border-t border-gray-200 dark:border-slate-700"></div>;
          
          if (el.type === "alert") {
            const icons = {
              info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
              success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            };
            return (
              <div key={elIdx} className={getColSpanClass(el.width)}>
                <div 
                  className="flex items-start gap-4 p-5 rounded-2xl border"
                  style={{ 
                    backgroundColor: `color-mix(in srgb, ${el.alertColor || '#3b82f6'} 10%, white)`,
                    borderColor: `color-mix(in srgb, ${el.alertColor || '#3b82f6'} 20%, transparent)` 
                  }}
                >
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: el.alertColor || '#3b82f6' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icons[el.icon || "info"]} />
                  </svg>
                  <p className="text-sm font-semibold leading-relaxed" style={{ color: el.alertColor || '#3b82f6' }}>
                    {el.text}
                  </p>
                </div>
              </div>
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

          if (el.inputType === "custom_parentesco") {
            const hasMadre = !!formData.madre_nombre;
            const hasPadre = !!formData.padre_nombre;
            const current = formData.acudiente_parentesco;

            return (
              <div key={el.id} className={getColSpanClass(el.width)}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {el.label} {el.required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button" 
                    disabled={!hasMadre}
                    onClick={() => handleParentescoSelect("Madre")}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold border transition-all ${!hasMadre ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : current === "Madre" ? 'bg-Sam text-white border-Sam' : 'bg-white text-slate-700 border-gray-300 hover:border-Sam'}`}
                  >
                    Madre
                  </button>
                  <button 
                    type="button" 
                    disabled={!hasPadre}
                    onClick={() => handleParentescoSelect("Padre")}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold border transition-all ${!hasPadre ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : current === "Padre" ? 'bg-Sam text-white border-Sam' : 'bg-white text-slate-700 border-gray-300 hover:border-Sam'}`}
                  >
                    Padre
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleParentescoSelect("Otro")}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold border transition-all ${current === "Otro" ? 'bg-Sam text-white border-Sam' : 'bg-white text-slate-700 border-gray-300 hover:border-Sam'}`}
                  >
                    Otro
                  </button>
                </div>
                {!current && el.required && (
                  <p className="text-red-500 text-xs mt-2">Debe seleccionar un acudiente</p>
                )}
              </div>
            );
          }

          // If the element is acudiente_nombre, etc., and Parentesco is NOT "Otro", we might want to hide them or make them readonly.
          // The image shows that when "Padre" is selected, the inputs ARE visible and prefilled. So we just render them normally!
          
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
                    <input type="checkbox" name={el.id} checked={formData[el.id] || false} onChange={handleChange} required={el.required} className="w-5 h-5 cursor-pointer" style={{ accentColor: el.checkboxColor || '#0e704d' }} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-extrabold cursor-pointer" style={{ color: el.checkboxColor || '#0e704d' }} onClick={() => setFormData(prev => ({ ...prev, [el.id]: !prev[el.id] }))}>
                      {el.label} {el.required && <span className="text-red-500">*</span>}
                    </label>
                    {el.helpText && (
                      <p className="text-xs mt-1 cursor-pointer opacity-80" style={{ color: el.checkboxColor || '#0e704d' }} onClick={() => setFormData(prev => ({ ...prev, [el.id]: !prev[el.id] }))}>
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
                  {el.helpText && <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 leading-tight">{el.helpText}</p>}
                  
                  {el.inputType === "textarea" ? (
                    <textarea name={el.id} required={el.required} value={formData[el.id] || ""} onChange={handleChange} placeholder={el.placeholder || ""} rows="3" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-Sam/50 transition-all text-sm"></textarea>
                  ) : el.inputType === "select" ? (
                    <select name={el.id} required={el.required} value={formData[el.id] || ""} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-Sam/50 transition-all text-sm appearance-none font-semibold">
                      <option value="" disabled>Seleccionar...</option>
                      {el.options?.split(',').map((opt, i) => <option key={i} value={opt.trim()}>{opt.trim()}</option>)}
                    </select>
                  ) : (
                    <input type={el.inputType} name={el.id} required={el.required} value={formData[el.id] || ""} onChange={handleChange} placeholder={el.placeholder || ""} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-Sam/50 transition-all text-sm" />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 dark:bg-slate-900 min-h-screen font-nunito text-slate-800 dark:text-slate-100 pb-16">
      <Toaster position="top-right" />

      <main className="max-w-4xl mx-auto px-4 pt-10">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-slate-700">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-Sam mb-4">{schema?.title || "Formulario"}</h1>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              {schema?.description}
            </p>
          </div>

          {isMultiStep ? (
            // ================= MODO MULTI-PASO =================
            <div className="mb-8">
              {/* Progress Bar */}
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Paso {currentStep + 1} de {schema?.sections?.length}</span>
                <span className="text-xs font-bold text-Sam">{Math.round(((currentStep + 1) / schema?.sections?.length) * 100)}% Completado</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                <div className="bg-Sam h-2 rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / schema?.sections?.length) * 100}%` }}></div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (currentStep === schema.sections.length - 1) handleSubmit(e);
                else handleNext();
              }}>
                {renderSection(schema.sections[currentStep], currentStep)}
                
                <div className="flex justify-between pt-8 border-t border-gray-200 dark:border-slate-700">
                  <button 
                    type="button" 
                    onClick={handlePrev} 
                    className={`px-6 py-3 font-bold rounded-full ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'bg-gray-100 hover:bg-gray-200 text-slate-600 transition-colors'}`}
                  >
                    Atrás
                  </button>
                  <button 
                    type="submit" 
                    className="bg-Sam hover:bg-green-800 text-white px-8 py-3 rounded-full font-bold shadow-md transition-all flex items-center gap-2"
                  >
                    {currentStep === schema.sections.length - 1 ? (
                      isSubmitting ? "Procesando..." : (schema?.submitText || "Finalizar")
                    ) : "Siguiente Paso →"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // ================= MODO PÁGINA ÚNICA =================
            <form onSubmit={handleSubmit} className="space-y-4">
              {schema?.sections?.map((section, idx) => renderSection(section, idx))}
              
              <div className="pt-8 text-center border-t border-gray-200 dark:border-slate-700">
                <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-Sam hover:bg-green-800 text-white px-10 py-4 rounded-full font-bold shadow-lg disabled:opacity-70 transition-all">
                  {isSubmitting ? "Procesando solicitud..." : (schema?.submitText || "Enviar Formulario")}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}
