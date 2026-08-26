import "./index.css";
import { useForm, FormProvider } from "react-hook-form";
import { Header } from "./components/Header";
import { Student } from "./components/Student";
import { Father } from "./components/Father";
import { Mother } from "./components/Mother";
import { Attendant } from "./components/Attendant";
import { Footer } from "./components/Footer";
import { useEffect, useState } from "react";
import Supabase from "./Supabase";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error", // "error" | "success"
  });

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
    if (modal.type === "success") {
      reset({
        student: { documento: "", nombres: "", apellidos: "", tipoDocumento: "Tarjeta de Identidad", nacimiento: "", grado: "", direccion: "" },
        father: { documento: "", nombres: "", apellidos: "", ocupacion: "", nacimiento: "", email: "", phone: "", direccion: "" },
        mother: { documento: "", nombres: "", apellidos: "", ocupacion: "", nacimiento: "", email: "", phone: "", direccion: "" },
        attendant: { select: "", documento: "", nombres: "", apellidos: "", tipoDocumento: "Cédula de Ciudadanía", parentesco: "", email: "", phone: "", direccion: "", contactoEmergencia: false, declaracionVeracidad: false },
      });
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openModal = (title, message, type = "error") => {
    setModal({ isOpen: true, title, message, type });
  };

  // 🔥 Manejo del Dark Mode a nivel de documento
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  // Lectura de configuraciones de entorno
  const googleSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
  const isSheetsConfigured = !!googleSheetsUrl;
  const isSupabaseConfigured = !!(import.meta.env.VITE_URL && import.meta.env.VITE_API_KEY);

  const methods = useForm({
    defaultValues: {
      student: { documento: "", nombres: "", apellidos: "", tipoDocumento: "Tarjeta de Identidad", nacimiento: "", grado: "", direccion: "", barrio: "" },
      father: { documento: "", nombres: "", apellidos: "", ocupacion: "", nacimiento: "", email: "", phone: "", direccion: "", barrio: "", viveConHijo: true },
      mother: { documento: "", nombres: "", apellidos: "", ocupacion: "", nacimiento: "", email: "", phone: "", direccion: "", barrio: "", viveConHijo: true },
      attendant: { select: "", documento: "", nombres: "", apellidos: "", tipoDocumento: "Cédula de Ciudadanía", parentesco: "", email: "", phone: "", direccion: "", barrio: "", declaracionVeracidad: false },
    },
  });

  const { handleSubmit, watch, setValue, reset, trigger, getValues } = methods;

  // 🔥 Sincronizar direcciones y barrios correctamente
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // 1. Si cambia la dirección del estudiante
      if (name === "student.direccion") {
        const dir = value.student.direccion || "";
        if (value.father?.viveConHijo) {
          setValue("father.direccion", dir);
        }
        if (value.mother?.viveConHijo) {
          setValue("mother.direccion", dir);
        }
        setValue("attendant.direccion", dir);
      }
      
      // 2. Si cambia el barrio del estudiante
      if (name === "student.barrio") {
        const bar = value.student.barrio || "";
        if (value.father?.viveConHijo) {
          setValue("father.barrio", bar);
        }
        if (value.mother?.viveConHijo) {
          setValue("mother.barrio", bar);
        }
        setValue("attendant.barrio", bar);
      }

      // 3. Si cambia el checkbox de "viveConHijo" del padre
      if (name === "father.viveConHijo") {
        if (value.father.viveConHijo) {
          const studentDir = getValues("student.direccion") || "";
          const studentBar = getValues("student.barrio") || "";
          setValue("father.direccion", studentDir);
          setValue("father.barrio", studentBar);
        }
      }

      // 4. Si cambia el checkbox de "viveConHijo" de la madre
      if (name === "mother.viveConHijo") {
        if (value.mother.viveConHijo) {
          const studentDir = getValues("student.direccion") || "";
          const studentBar = getValues("student.barrio") || "";
          setValue("mother.direccion", studentDir);
          setValue("mother.barrio", studentBar);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue, getValues]);

  // ---------------------------------------------------
  //                 NAVEGACIÓN DEL STEPPER
  // ---------------------------------------------------
  const handleNext = async () => {
    if (step === 1) {
      // Validar datos de Estudiante en el form
      const isValid = await trigger("student");
      if (!isValid) {
        toast.error("Por favor complete los campos obligatorios del estudiante.");
        return;
      }

      // Verificación de duplicados en Google Sheets
      const studentDoc = watch("student.documento")?.trim();
      if (!studentDoc) return;

      const toastId = toast.loading("Verificando registro del estudiante...");
      try {
        const response = await fetch(`${googleSheetsUrl}/search?student_doc=${studentDoc}`);
        if (response.ok) {
          const list = await response.json();
          if (list && list.length > 0) {
            toast.dismiss(toastId);
            openModal(
              "Estudiante ya registrado",
              `El estudiante con número de documento ${studentDoc} ya se encuentra registrado en el sistema escolar. Verifique la información ingresada.`,
              "error"
            );
            return;
          }
        }
      } catch (err) {
        console.error("Error al buscar estudiante:", err);
      } finally {
        toast.dismiss(toastId);
      }

      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });

    } else if (step === 2) {
      // Validar datos de Padres en el form
      const isValid = await trigger(["father", "mother"]);
      if (!isValid) {
        toast.error("Por favor corrija los errores en los datos de los padres.");
        return;
      }

      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ---------------------------------------------------
  //                 SUBMIT PRINCIPAL
  // ---------------------------------------------------
  const onSubmit = async (data) => {
    // Validar que Google Sheets esté configurado
    if (!isSheetsConfigured) {
      toast.error("No se puede guardar porque falta configurar la URL de Google Sheets.");
      return;
    }

    // Validar que al menos un acudiente tenga documento
    if (
      !data.father.documento &&
      !data.mother.documento &&
      !data.attendant.documento
    ) {
      toast.error("Debe registrar al menos un acudiente (padre, madre o acudiente).");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Guardando datos...");

    try {
      // 1. Reestructurar datos para el API de Google Sheets (formato SheetDB)
      const studentAddr = ((data.student.direccion || "").trim() + (data.student.barrio ? " - " + data.student.barrio.trim() : "")).toUpperCase();
      const fatherAddr = ((data.father.direccion || "").trim() + (data.father.barrio ? " - " + data.father.barrio.trim() : "")).toUpperCase();
      const motherAddr = ((data.mother.direccion || "").trim() + (data.mother.barrio ? " - " + data.mother.barrio.trim() : "")).toUpperCase();
      const attendantAddr = ((data.attendant.direccion || "").trim() + (data.attendant.barrio ? " - " + data.attendant.barrio.trim() : "")).toUpperCase();

      const sheetdbPayload = {
        data: [
          {
            fecha: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
            student_doc: data.student.documento,
            student_name: (data.student.nombres || "").toUpperCase().trim(),
            student_lastname: (data.student.apellidos || "").toUpperCase().trim(),
            student_birth: data.student.nacimiento,
            student_grade: data.student.grado,
            student_address: studentAddr,
            attendant_type: data.attendant.select,
            father_doc: data.father.documento || "",
            father_name: (data.father.nombres || "").toUpperCase().trim(),
            father_lastname: (data.father.apellidos || "").toUpperCase().trim(),
            father_birth: data.father.nacimiento || "",
            father_email: data.father.email || "",
            father_phone: data.father.phone || "",
            father_address: fatherAddr,
            mother_doc: data.mother.documento || "",
            mother_name: (data.mother.nombres || "").toUpperCase().trim(),
            mother_lastname: (data.mother.apellidos || "").toUpperCase().trim(),
            mother_birth: data.mother.nacimiento || "",
            mother_email: data.mother.email || "",
            mother_phone: data.mother.phone || "",
            mother_address: motherAddr,
            attendant_doc: data.attendant.documento || "",
            attendant_name: (data.attendant.nombres || "").toUpperCase().trim(),
            attendant_lastname: (data.attendant.apellidos || "").toUpperCase().trim(),
            attendant_relation: (data.attendant.parentesco || "").toUpperCase().trim(),
            attendant_email: data.attendant.email || "",
            attendant_phone: data.attendant.phone || "",
            attendant_address: attendantAddr
          }
        ]
      };

      // 2. Guardar en Google Sheets (Almacenamiento Primario vía API)
      try {
        const response = await fetch(googleSheetsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sheetdbPayload),
        });

        if (!response.ok) {
          throw new Error(`Servidor de API Sheets respondió con código ${response.status}`);
        }

        const resData = await response.json();
        if (!resData || (!resData.created && resData.status !== "success" && !Array.isArray(resData))) {
          throw new Error(resData.error || "No se pudo registrar la fila en el API de Google Sheets.");
        }
      } catch (sheetError) {
        console.error("Error al enviar a API de Google Sheets:", sheetError);
        throw new Error(`Google Sheets API: ${sheetError.message}`);
      }

      // 2. Guardar en Supabase (Almacenamiento Secundario / Opcional)
      let supabaseSuccess = true;
      let supabaseErrorMsg = "";

      if (isSupabaseConfigured) {
        toast.loading("Sincronizando con Supabase...", { id: toastId });
        try {
          // PADRE
          if (data.father.documento) {
            const father = {
              document_father: data.father.documento.toUpperCase().trim(),
              name_father: (data.father.nombres || "").toUpperCase().trim(),
              lastName_father: (data.father.apellidos || "").toUpperCase().trim(),
              date_father: data.father.nacimiento || null,
              email_father: (data.father.email || "").trim(),
              phone_father: (data.father.phone || "").trim(),
              addres_father: fatherAddr,
            };

            const { error: errorFather } = await Supabase.from("fathers").upsert(
              father,
              { onConflict: "document_father" }
            );

            if (errorFather) throw new Error(`Padre: ${errorFather.message}`);
          }

          // MADRE
          if (data.mother.documento) {
            const mother = {
              document_mother: data.mother.documento.toUpperCase().trim(),
              name_mother: (data.mother.nombres || "").toUpperCase().trim(),
              lastName_mother: (data.mother.apellidos || "").toUpperCase().trim(),
              date_mother: data.mother.nacimiento || null,
              email_mother: (data.mother.email || "").trim(),
              phone_mother: (data.mother.phone || "").trim(),
              addres_mother: motherAddr,
            };

            const { error: errorMother } = await Supabase.from("mothers").upsert(
              mother,
              { onConflict: "document_mother" }
            );

            if (errorMother) throw new Error(`Madre: ${errorMother.message}`);
          }

          // ACUDIENTE (OTRO)
          if (data.attendant.select === "otro" && data.attendant.documento) {
            const attendant = {
              document_attendant: data.attendant.documento.toUpperCase().trim(),
              name_attendant: (data.attendant.nombres || "").toUpperCase().trim(),
              lastName_attendant: (data.attendant.apellidos || "").toUpperCase().trim(),
              relationship_attendant: (data.attendant.parentesco || "").toUpperCase().trim(),
              email_attendant: (data.attendant.email || "").trim(),
              phone_attendant: (data.attendant.phone || "").trim(),
              addres_attendant: attendantAddr,
            };

            const { error: errorAttendant } = await Supabase.from("attendant").upsert(
              attendant,
              { onConflict: "document_attendant" }
            );

            if (errorAttendant) throw new Error(`Acudiente: ${errorAttendant.message}`);
          }

          // ESTUDIANTE
          if (data.student.documento) {
            const student = {
              document_student: data.student.documento.toUpperCase().trim(),
              name_student: (data.student.nombres || "").toUpperCase().trim(),
              lastName_student: (data.student.apellidos || "").toUpperCase().trim(),
              date_student: data.student.nacimiento || null,
              addres_student: studentAddr,
              grade_student: (data.student.grado || "").trim(),
              attendant: (data.attendant.select || "").trim(),
              id_father: data.father.documento || null,
              id_mother: data.mother.documento || null,
              id_attendant:
                data.attendant.select === "otro" ? (data.attendant.documento || null) : null,
            };

            const { error: errorStudent } = await Supabase.from("students").upsert(
              student,
              { onConflict: "document_student" }
            );

            if (errorStudent) throw new Error(`Estudiante: ${errorStudent.message}`);
          }
        } catch (supabaseError) {
          console.error("Error al guardar en Supabase:", supabaseError);
          supabaseSuccess = false;
          supabaseErrorMsg = supabaseError.message;
        }
      }

      // 3. Notificación final al usuario
      if (isSupabaseConfigured && !supabaseSuccess) {
        toast.dismiss(toastId);
        openModal(
          "Registro Parcial",
          `Los datos se guardaron con éxito en Google Sheets, pero la sincronización secundaria con Supabase falló: ${supabaseErrorMsg}`,
          "error"
        );
      } else {
        toast.dismiss(toastId);
        openModal(
          "¡Registro Exitoso!",
          "La actualización de datos del estudiante se ha guardado correctamente en la hoja de cálculo de Google Sheets.",
          "success"
        );
      }

    } catch (error) {
      console.error("Error en proceso de guardado:", error);
      toast.error(error.message || "No se pudieron guardar los datos.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubtitle = () => {
    if (step === 1) return "Por favor, verifica y actualiza la información requerida para el nuevo periodo escolar.";
    if (step === 2) return "Por favor, verifica y actualiza la información de los padres o tutores.";
    return "Por favor, completa la información requerida para mantener actualizado el expediente del estudiante.";
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Modal de Alerta Grande */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-gray-100 dark:border-slate-700/50 text-center relative max-h-[90vh] overflow-y-auto transform scale-100 transition-transform">
            
            {modal.type === "error" ? (
              <div className="w-16 h-16 mx-auto text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-full mb-4 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-full mb-4 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}

            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {modal.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
              {modal.message}
            </p>

            <button
              type="button"
              onClick={closeModal}
              className={`w-full font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer select-none text-white outline-none ${
                modal.type === "error" 
                  ? "bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200" 
                  : "bg-[#0e704d] hover:bg-green-700 focus:ring-4 focus:ring-green-200"
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <Header theme={theme} setTheme={setTheme} />
      
      {/* Contenido principal centrado */}
      <div className="flex justify-center items-center flex-col w-full max-w-5xl px-4 mx-auto pb-12 transition-colors duration-300">
        
        {/* Título de la página y subtítulo dinámico */}
        <h1 className="text-[1.8rem] md:text-[2.5rem] mt-10 font-bold text-slate-800 dark:text-slate-100 transition-colors duration-300 text-center">
          Actualización de Datos
        </h1>
        <p className="md:text-[1.1rem] text-slate-500 dark:text-slate-400 mt-2 transition-colors duration-300 text-center max-w-xl leading-relaxed">
          {getSubtitle()}
        </p>
        
        {/* Banner: Falta Google Sheets (Obligatorio) */}
        {!isSheetsConfigured && (
          <div className="w-full bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg my-4 shadow-md text-sm md:text-base">
            <p className="font-bold">⚠️ Falta configuración de Google Sheets (Obligatorio)</p>
            <p className="mt-1">
              Crea un archivo llamado <code className="bg-red-200 px-1 py-0.5 rounded font-mono">.env</code> en la raíz del proyecto y agrega la URL de tu aplicación web de Google Apps Script:
            </p>
            <pre className="bg-red-950 text-red-200 p-2 rounded mt-2 text-xs overflow-x-auto font-mono text-left">
{`VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/xxxx/exec`}
            </pre>
          </div>
        )}

        {/* Stepper Indicator - Desktop */}
        <div className="hidden md:flex items-center justify-center w-full max-w-2xl my-8 relative px-10">
          {/* Línea conector base (gris) */}
          <div className="absolute top-4.5 left-16 right-16 h-0.5 bg-gray-200 dark:bg-slate-700 z-0" />
          
          {/* Línea conector activa (verde) */}
          <div 
            className="absolute top-4.5 left-16 h-0.5 bg-Sam transition-all duration-300 z-0" 
            style={{ 
              width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" 
            }} 
          />

          <div className="flex justify-between w-full relative z-10">
            {/* Paso 1 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                step >= 1 
                  ? "bg-Sam border-Sam text-white" 
                  : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-500"
              }`}>
                {step > 1 ? "✓" : "1"}
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${
                step >= 1 ? "text-Sam dark:text-green-400" : "text-gray-400 dark:text-slate-500"
              }`}>
                Estudiante
              </span>
            </div>

            {/* Paso 2 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                step === 2 
                  ? "bg-white dark:bg-slate-800 border-Sam text-Sam dark:text-green-400 ring-4 ring-Sam/20" 
                  : step > 2
                    ? "bg-Sam border-Sam text-white"
                    : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500"
              }`}>
                {step > 2 ? "✓" : "2"}
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${
                step >= 2 ? "text-slate-800 dark:text-slate-200" : "text-gray-400 dark:text-slate-500"
              }`}>
                Padres
              </span>
            </div>

            {/* Paso 3 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                step === 3 
                  ? "bg-Sam border-Sam text-white ring-4 ring-Sam/20" 
                  : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500"
              }`}>
                3
              </div>
              <span className={`text-xs font-bold transition-colors duration-300 ${
                step === 3 ? "text-Sam dark:text-green-400" : "text-gray-400 dark:text-slate-500"
              }`}>
                Acudiente
              </span>
            </div>
          </div>
        </div>

        {/* Stepper Indicator - Mobile */}
        <div className="md:hidden w-full my-6 px-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Paso {step} de 3: {step === 1 ? "Datos del Estudiante" : step === 2 ? "Datos de los Padres" : "Datos del Acudiente"}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-Sam dark:bg-green-500 h-full transition-all duration-300" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <FormProvider {...methods}>
          <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
            <fieldset disabled={isSubmitting} className="contents">
              {/* Render condicional de cada paso */}
              {step === 1 && <Student />}
              
              {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
                  <Father />
                  <Mother />
                </div>
              )}
              
              {step === 3 && <Attendant />}

              {/* Botones de Navegación del Stepper */}
              <div className="flex justify-between items-center gap-4 w-full mt-8">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 max-w-[180px] bg-white dark:bg-slate-800 text-[#0e704d] dark:text-green-400 border border-[#0e704d] dark:border-green-500/30 p-2.5 rounded-lg font-bold hover:bg-green-50/50 dark:hover:bg-slate-700/50 transition-all duration-300 cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Anterior
                  </button>
                ) : (
                  <div className="flex-1 max-w-[180px] hidden md:block" />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 max-w-[180px] bg-[#0e704d] hover:bg-green-700 text-white p-2.5 rounded-lg font-bold transition-all duration-300 cursor-pointer text-center flex items-center justify-center gap-2 ml-auto"
                  >
                    <span>{step === 1 ? "Siguiente" : "Siguiente Paso"}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !isSheetsConfigured}
                    className="flex-1 max-w-[200px] bg-[#0e704d] hover:bg-green-700 text-white p-2.5 rounded-lg font-bold disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer ml-auto transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <span>Guardar Cambios</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </FormProvider>
      </div>

      <Footer />
    </>
  );
}

export default App;
