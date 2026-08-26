import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import Supabase from "../Supabase";

export const Father = () => {
  const [fatherData, setFatherData] = useState(null);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const docValue = watch("father.documento");

  // 🧩 Limpiar datos si el documento se borra (ej. al resetear el formulario)
  useEffect(() => {
    if (!docValue || docValue.trim() === "") {
      setFatherData(null);
    }
  }, [docValue]);

  // 🔍 Buscar padre por documento
  const readFatherData = async (doc) => {
    if (!doc || doc.trim().length < 5) {
      setFatherData(null);
      return; // evita búsquedas con menos de 5 caracteres
    }

    const { data: father, error } = await Supabase.from("fathers")
      .select("*")
      .eq("document_father", doc)
      .maybeSingle(); // devuelve un único registro o null

    if (error) {
      console.error("Error al leer padre:", error);
      setFatherData(null);
      return;
    }

    setFatherData(father || null);
  };

  // 🧩 Actualiza los campos del formulario cuando cambie fatherData
  useEffect(() => {
    if (fatherData) {
      setValue("father.nombres", fatherData.name_father || "");
      setValue("father.apellidos", fatherData.lastName_father || "");
      setValue("father.email", fatherData.email_father || "");
      setValue("father.nacimiento", fatherData.date_father || "");
      setValue("father.phone", fatherData.phone_father || "");
      setValue("father.ocupacion", fatherData.occupation_father || "");
      
      const rawAddress = fatherData.addres_father || "";
      const parts = rawAddress.split(/\s*-\s*/);
      setValue("father.direccion", parts[0] || "");
      setValue("father.barrio", parts[1] || "");
    } else {
      // Limpia todos los campos si no hay resultados
      setValue("father.nombres", "");
      setValue("father.apellidos", "");
      setValue("father.email", "");
      setValue("father.nacimiento", "");
      setValue("father.phone", "");
      setValue("father.ocupacion", "");
      setValue("father.direccion", "");
      setValue("father.barrio", "");
    }
  }, [fatherData, setValue]);

  return (
    <div className="bg-white dark:bg-slate-800 w-full p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700/50 transition-all duration-300">
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-green-50 dark:bg-slate-900 rounded-lg text-Sam dark:text-green-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Datos del Padre</h3>
      </div>
      
      <hr className="my-4 border-gray-100 dark:border-slate-700" />
      
      <div className="flex flex-col gap-4">
        {/* Documento de Identidad (Primero para búsqueda) */}
        <div>
          <label htmlFor="father-documento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Documento de Identidad (Opcional)
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            type="text"
            id="father-documento"
            {...register("father.documento", {
              onBlur: (e) => readFatherData(e.target.value),
            })}
          />
        </div>

        {/* Nombres Completos y Apellidos Completos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="father-nombres" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Nombres Completos
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
              type="text"
              id="father-nombres"
              {...register("father.nombres", {
                required: docValue ? "Campo obligatorio" : false,
              })}
            />
            {errors.father?.nombres && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.father.nombres.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="father-apellidos" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Apellidos Completos
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
              type="text"
              id="father-apellidos"
              {...register("father.apellidos", {
                required: docValue ? "Campo obligatorio" : false,
              })}
            />
            {errors.father?.apellidos && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.father.apellidos.message}</p>
            )}
          </div>
        </div>

        {/* Ocupación */}
        <div>
          <label htmlFor="father-ocupacion" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Ocupación
          </label>
          <select
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            id="father-ocupacion"
            {...register("father.ocupacion")}
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
            <label htmlFor="father-phone" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Teléfono Móvil
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
              type="tel"
              id="father-phone"
              {...register("father.phone", {
                required: docValue ? "Campo obligatorio" : false,
              })}
            />
            {errors.father?.phone && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.father.phone.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="father-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Correo Electrónico
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
              type="email"
              id="father-email"
              {...register("father.email", {
                pattern: {
                  value: /^[a-z0-9._%+ -]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
                  message: "Correo inválido",
                },
              })}
            />
            {errors.father?.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.father.email.message}</p>
            )}
          </div>
        </div>

        {/* Checkbox: Vive con el estudiante */}
        <div className="flex items-center gap-2 mt-2 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-800">
          <input
            type="checkbox"
            id="father-vive-con-hijo"
            className="w-4.5 h-4.5 text-Sam border-gray-300 rounded focus:ring-Sam focus:ring-2 accent-Sam cursor-pointer shrink-0"
            {...register("father.viveConHijo")}
          />
          <label htmlFor="father-vive-con-hijo" className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none leading-tight">
            ¿Vive con el estudiante? (Misma dirección)
          </label>
        </div>

        {/* Dirección y Barrio del Padre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="father-direccion" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Dirección de Residencia
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium disabled:opacity-65 disabled:cursor-not-allowed"
              type="text"
              id="father-direccion"
              disabled={watch("father.viveConHijo")}
              {...register("father.direccion", {
                required: (docValue && !watch("father.viveConHijo")) ? "Campo obligatorio" : false,
              })}
            />
            {errors.father?.direccion && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.father.direccion.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="father-barrio" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Barrio
            </label>
            <input
              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium disabled:opacity-65 disabled:cursor-not-allowed"
              type="text"
              id="father-barrio"
              disabled={watch("father.viveConHijo")}
              {...register("father.barrio", {
                required: (docValue && !watch("father.viveConHijo")) ? "Campo obligatorio" : false,
              })}
            />
            {errors.father?.barrio && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.father.barrio.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
