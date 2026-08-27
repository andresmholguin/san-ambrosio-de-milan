import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import Supabase from "../Supabase";

export const FormAttendant = ({ attendantSelect }) => {
  const [attendantData, setAttendantData] = useState(null);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const docValue = watch("attendant.documento");

  // 🧩 Limpiar datos si el documento se borra (ej. al resetear el formulario)
  useEffect(() => {
    if (!docValue || docValue.trim() === "") {
      setAttendantData(null);
    }
  }, [docValue]);

  // 🔍 Buscar acudiente por documento
  const readAttendantData = async (doc) => {
    if (!doc || doc.trim().length < 5) {
      setAttendantData(null);
      return; // evita búsquedas con menos de 5 caracteres
    }

    const { data: attendant, error } = await Supabase.from("attendant")
      .select("*")
      .eq("document_attendant", doc)
      .maybeSingle(); // devuelve un único registro o null

    if (error) {
      console.error("Error al leer acudiente:", error);
      setAttendantData(null);
      return;
    }

    setAttendantData(attendant || null);
  };

  // 🧩 Actualiza los campos del formulario cuando cambie attendantData
  useEffect(() => {
    if (attendantData) {
      setValue("attendant.nombres", attendantData.name_attendant || "");
      setValue("attendant.apellidos", attendantData.lastName_attendant || "");
      setValue("attendant.email", attendantData.email_attendant || "");
      setValue("attendant.direccion", attendantData.addres_attendant || "");
      setValue("attendant.phone", attendantData.phone_attendant || "");
      setValue("attendant.parentesco", attendantData.relationship_attendant || "");
    } else {
      // Limpia todos los campos si no hay resultados (solo si es "otro" o "abuelo(a)")
      if (attendantSelect === "otro" || attendantSelect === "abuelo(a)") {
        setValue("attendant.nombres", "");
        setValue("attendant.apellidos", "");
        setValue("attendant.email", "");
        setValue("attendant.direccion", "");
        setValue("attendant.phone", "");
        setValue("attendant.parentesco", "");
      }
    }
  }, [attendantData, setValue, attendantSelect]);

  return (
    <div className="flex flex-col gap-4 mt-6">
      {/* Nombres y Apellidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="attendant-nombres" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Nombres
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
            type="text"
            id="attendant-nombres"
            {...register("attendant.nombres", {
              required: docValue ? "Campo obligatorio" : false,
            })}
          />
          {errors.attendant?.nombres && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.nombres.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="attendant-apellidos" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Apellidos
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
            type="text"
            id="attendant-apellidos"
            {...register("attendant.apellidos", {
              required: docValue ? "Campo obligatorio" : false,
            })}
          />
          {errors.attendant?.apellidos && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.apellidos.message}</p>
          )}
        </div>
      </div>

      {/* Tipo de Documento y Número de Documento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="attendant-tipo-documento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Tipo de Documento
          </label>
          <select
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            id="attendant-tipo-documento"
            {...register("attendant.tipoDocumento")}
          >
            <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
            <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
            <option value="Cédula de Extranjería">Cédula de Extranjería</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </div>
        <div>
          <label htmlFor="attendant-documento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Número de Documento
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            type="text"
            id="attendant-documento"
            {...register("attendant.documento", {
              required: "Campo obligatorio",
              onBlur: (e) => readAttendantData(e.target.value),
            })}
          />
          {errors.attendant?.documento && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.documento.message}</p>
          )}
        </div>
      </div>

      {/* Celular y Correo electrónico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="attendant-phone" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Teléfono Celular
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            type="tel"
            id="attendant-phone"
            {...register("attendant.phone", {
              required: docValue ? "Campo obligatorio" : false,
            })}
          />
          {errors.attendant?.phone && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.phone.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="attendant-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Correo Electrónico
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            type="email"
            id="attendant-email"
            {...register("attendant.email", {
              required: docValue ? "Campo obligatorio" : false,
            })}
          />
          {errors.attendant?.email && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.email.message}</p>
          )}
        </div>
      </div>

      {/* Direccion y Barrio (Visible solo para 'otro') */}
      {attendantSelect === "otro" && (
        <>
          {/* Checkbox Vive con el estudiante */}
          <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 mt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked={false}
                className="w-5 h-5 text-Sam rounded border-gray-300 dark:border-slate-600 focus:ring-Sam dark:focus:ring-green-400 bg-white dark:bg-slate-800 transition-all cursor-pointer"
                {...register("attendant.viveConHijo")}
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                El acudiente vive en la misma dirección del estudiante
              </span>
            </label>
          </div>

          {!watch("attendant.viveConHijo") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-fade-in">
              <div>
                <label htmlFor="attendant-direccion" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Dirección
                </label>
                <input
                  className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
                  type="text"
                  id="attendant-direccion"
                  {...register("attendant.direccion", {
                    required: !watch("attendant.viveConHijo") ? "Campo obligatorio" : false,
                  })}
                />
                {errors.attendant?.direccion && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.direccion.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="attendant-barrio" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Barrio
                </label>
                <input
                  className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
                  type="text"
                  id="attendant-barrio"
                  {...register("attendant.barrio", {
                    required: !watch("attendant.viveConHijo") ? "Campo obligatorio" : false,
                  })}
                />
                {errors.attendant?.barrio && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.barrio.message}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Relación con el estudiante (Solo cuando es "Otro") */}
      {attendantSelect === "otro" && (
        <div className="mt-2">
          <label htmlFor="attendant-parentesco" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Especifique el Parentesco <span className="text-xs lowercase text-slate-400">(Ej: Abuelo, Tío, Hermano)</span>
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
            type="text"
            id="attendant-parentesco"
            placeholder="Ejemplo: TÍO"
            {...register("attendant.parentesco", {
              required: docValue ? "Campo obligatorio" : false,
            })}
          />
          {errors.attendant?.parentesco && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.parentesco.message}</p>
          )}
        </div>
      )}

      {/* Información: Contacto de Emergencia Automático */}
      <div className="flex items-start gap-2.5 bg-blue-50/50 dark:bg-slate-900/60 p-4 rounded-xl border border-blue-200/50 dark:border-slate-700 mt-4 text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>
          El acudiente seleccionado se considerará automáticamente como el contacto principal de emergencia ante cualquier eventualidad médica o escolar.
        </span>
      </div>

      {/* Checkbox 2: Declaración de Veracidad (Términos) */}
      <div className="flex items-start gap-3 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-xl border border-green-200 dark:border-green-800/40 my-2 transition-colors">
        <input
          type="checkbox"
          id="veracity-declare"
          className="mt-1 h-4 w-4 text-Sam rounded border-green-300 dark:border-green-700 focus:ring-Sam dark:focus:ring-green-400 cursor-pointer"
          {...register("attendant.declaracionVeracidad", { required: "Debe aceptar esta declaración" })}
        />
        <div>
          <label htmlFor="veracity-declare" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none leading-relaxed">
            Declaro que la información suministrada en este formulario es veraz, completa y actual. Autorizo al Colegio San Ambrosio para el tratamiento de estos datos conforme a la política de privacidad y la normativa vigente.
          </label>
          {errors.attendant?.declaracionVeracidad && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.attendant.declaracionVeracidad.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};
