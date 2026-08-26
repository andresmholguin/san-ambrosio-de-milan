import { FormAttendant } from "./FormAttendant.jsx";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";

export const Attendant = () => {
  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext();

  const attendantSelect = watch("attendant.select");
  const attendantParentesco = watch("attendant.parentesco");
  const fatherID = watch("father.documento");
  const motherID = watch("mother.documento");

  // Resolver la relación activa para pintar los botones
  const getActiveRel = () => {
    if (attendantSelect === "madre") return "Madre";
    if (attendantSelect === "padre") return "Padre";
    if (attendantSelect === "otro" && attendantParentesco === "ABUELO(A)") return "Abuelo(a)";
    if (attendantSelect === "otro") return "Otro";
    return "";
  };

  const activeRel = getActiveRel();

  // Función al hacer click en los botones del selector
  const handleSelectRelationship = (rel) => {
    if (rel === "Padre") {
      setValue("attendant.select", "padre");
      setValue("attendant.parentesco", "PADRE");
      
      const fatherData = getValues("father") || {};
      setValue("attendant.nombres", fatherData.nombres || "");
      setValue("attendant.apellidos", fatherData.apellidos || "");
      setValue("attendant.documento", fatherData.documento || "");
      setValue("attendant.phone", fatherData.phone || "");
      setValue("attendant.email", fatherData.email || "");
    } else if (rel === "Madre") {
      setValue("attendant.select", "madre");
      setValue("attendant.parentesco", "MADRE");
      
      const motherData = getValues("mother") || {};
      setValue("attendant.nombres", motherData.nombres || "");
      setValue("attendant.apellidos", motherData.apellidos || "");
      setValue("attendant.documento", motherData.documento || "");
      setValue("attendant.phone", motherData.phone || "");
      setValue("attendant.email", motherData.email || "");
    } else {
      setValue("attendant.select", "otro");
      setValue("attendant.parentesco", "");
      setValue("attendant.nombres", "");
      setValue("attendant.apellidos", "");
      setValue("attendant.documento", "");
      setValue("attendant.phone", "");
      setValue("attendant.email", "");
    }
  };

  // Registrar campos ocultos necesarios en react-hook-form para no romper submit
  useEffect(() => {
    register("attendant.select", { required: "Debe seleccionar un acudiente" });
    register("attendant.parentesco");
  }, [register]);

  return (
    <div className="bg-white dark:bg-slate-800 w-full p-6 md:p-10 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700/50 transition-all duration-300">
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-green-50 dark:bg-slate-900 rounded-lg text-Sam dark:text-green-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Datos del Acudiente Principal</h3>
      </div>
      
      <hr className="my-6 border-gray-100 dark:border-slate-700" />
      
      {/* Selector de Parentesco */}
      <div>
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
          Parentesco con el estudiante
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
          {["Madre", "Padre", "Otro"].map((rel) => {
            const isAvailable = 
              rel === "Otro" || 
              (rel === "Padre" && fatherID && fatherID.trim() !== "") ||
              (rel === "Madre" && motherID && motherID.trim() !== "");

            return (
              <button
                key={rel}
                type="button"
                onClick={() => isAvailable && handleSelectRelationship(rel)}
                disabled={!isAvailable}
                className={`p-3 rounded-lg border text-center font-bold text-sm transition-all cursor-pointer select-none outline-none ${
                  !isAvailable 
                    ? "opacity-40 cursor-not-allowed bg-gray-50 dark:bg-slate-900 text-gray-400 border-gray-200 dark:border-slate-800"
                    : activeRel === rel
                      ? "bg-Sam text-white border-Sam ring-2 ring-Sam/20"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600/50"
                }`}
              >
                {rel}
              </button>
            );
          })}
        </div>
        
        {errors.attendant?.select && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.select.message}</p>
        )}
      </div>

      {/* Formulario de Detalles (Visible si hay selección activa) */}
      {activeRel !== "" && (
        <FormAttendant attendantSelect={attendantSelect} />
      )}
    </div>
  );
};
