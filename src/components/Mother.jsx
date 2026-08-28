import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";

export const Mother = () => {
  const [motherData, setMotherData] = useState(null);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const docValue = watch("mother.documento");

  // 🧩 Limpiar datos si el documento se borra (ej. al resetear el formulario)
  useEffect(() => {
    if (!docValue || docValue.trim() === "") {
      setMotherData(null);
    }
  }, [docValue]);

  // 🔍 Buscar madre por documento (preparado para Firestore)
  const readMotherData = async (doc) => {
    if (!doc || doc.trim().length < 5) {
      setMotherData(null);
      return;
    }
  };

  // 🧩 Actualiza los campos del formulario cuando cambie motherData
  useEffect(() => {
    if (motherData) {
      setValue("mother.nombres", motherData.name_mother || "");
      setValue("mother.apellidos", motherData.lastName_mother || "");
      setValue("mother.email", motherData.email_mother || "");
      setValue("mother.nacimiento", motherData.date_mother || "");
      setValue("mother.phone", motherData.phone_mother || "");
      setValue("mother.ocupacion", motherData.occupation_mother || "");
      
      const rawAddress = motherData.addres_mother || "";
      const parts = rawAddress.split(/\s*-\s*/);
      setValue("mother.direccion", parts[0] || "");
      setValue("mother.barrio", parts[1] || "");
    } else {
      // Limpia todos los campos si no hay resultados
      setValue("mother.nombres", "");
      setValue("mother.apellidos", "");
      setValue("mother.email", "");
      setValue("mother.nacimiento", "");
      setValue("mother.phone", "");
      setValue("mother.ocupacion", "");
      setValue("mother.direccion", "");
      setValue("mother.barrio", "");
    }
  }, [motherData, setValue]);

  return (
    <div className="bg-white dark:bg-slate-800 w-full p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700/50 transition-all duration-300">
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-green-50 dark:bg-slate-900 rounded-lg text-Sam dark:text-green-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Datos de la Madre</h2>
      </div>
      
      <hr className="my-4 border-gray-100 dark:border-slate-700" />
      
      <div className="flex flex-col gap-4">
        {/* Tipo de Documento y Número de Documento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mother-tipo-documento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Tipo de Documento
            </label>
            <select
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
              id="mother-tipo-documento"
              {...register("mother.tipoDocumento")}
            >
              <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
              <option value="Cédula de Extranjería">Cédula de Extranjería</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          <div>
            <label htmlFor="mother-documento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Número de Documento
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
              type="text"
              id="mother-documento"
              {...register("mother.documento", {
                onBlur: (e) => readMotherData(e.target.value),
              })}
            />
            {errors.mother?.documento && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mother.documento.message}</p>
            )}
          </div>
        </div>

        {/* Nombres Completos y Apellidos Completos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mother-nombres" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Nombres Completos
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
              type="text"
              id="mother-nombres"
              {...register("mother.nombres", {
                required: docValue ? "Campo obligatorio" : false,
              })}
            />
            {errors.mother?.nombres && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mother.nombres.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="mother-apellidos" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Apellidos Completos
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
              type="text"
              id="mother-apellidos"
              {...register("mother.apellidos", {
                required: docValue ? "Campo obligatorio" : false,
              })}
            />
            {errors.mother?.apellidos && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mother.apellidos.message}</p>
            )}
          </div>
        </div>

        {/* Ocupación */}
        <div>
          <label htmlFor="mother-ocupacion" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Ocupación
          </label>
          <select
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            id="mother-ocupacion"
            {...register("mother.ocupacion")}
          >
            <option value="">Seleccione la ocupación</option>
            <option value="Empleado">Empleado</option>
            <option value="Trabajador">Trabajador</option>
            <option value="Empresario / Empleador">Empresario / Empleador</option>
            <option value="Estudiante">Estudiante</option>
            <option value="Jubilado / Pensionado">Jubilado / Pensionado</option>
            <option value="Labores del hogar">Labores del hogar</option>
            <option value="Desempleado">Desempleado</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* Celular y Email side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mother-phone" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Teléfono Móvil
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
              type="tel"
              id="mother-phone"
              {...register("mother.phone", {
                required: docValue ? "Campo obligatorio" : false,
              })}
            />
            {errors.mother?.phone && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mother.phone.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="mother-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Correo Electrónico
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
              type="email"
              id="mother-email"
              {...register("mother.email", {
                pattern: {
                  value: /^[a-z0-9._%+ -]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
                  message: "Correo inválido",
                },
              })}
            />
            {errors.mother?.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mother.email.message}</p>
            )}
          </div>
        </div>

        {/* Checkbox: Vive con el estudiante */}
        <div className="flex items-center gap-2 mt-2 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-800">
          <input
            type="checkbox"
            id="mother-vive-con-hijo"
            className="w-4.5 h-4.5 text-Sam border-gray-300 rounded focus:ring-Sam focus:ring-2 accent-Sam cursor-pointer shrink-0"
            {...register("mother.viveConHijo")}
          />
          <label htmlFor="mother-vive-con-hijo" className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none leading-tight">
            ¿Vive con el estudiante? (Misma dirección)
          </label>
        </div>

        {/* Dirección y Barrio de la Madre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mother-direccion" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Dirección de Residencia
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium read-only:opacity-65 read-only:cursor-not-allowed read-only:bg-gray-50 dark:read-only:bg-slate-800"
              type="text"
              id="mother-direccion"
              readOnly={watch("mother.viveConHijo")}
              {...register("mother.direccion", {
                required: (docValue && !watch("mother.viveConHijo")) ? "Campo obligatorio" : false,
              })}
            />
            {errors.mother?.direccion && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mother.direccion.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="mother-barrio" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Barrio
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium read-only:opacity-65 read-only:cursor-not-allowed read-only:bg-gray-50 dark:read-only:bg-slate-800"
              type="text"
              id="mother-barrio"
              readOnly={watch("mother.viveConHijo")}
              {...register("mother.barrio", {
                required: (docValue && !watch("mother.viveConHijo")) ? "Campo obligatorio" : false,
              })}
            />
            {errors.mother?.barrio && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.mother.barrio.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
