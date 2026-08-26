import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import Supabase from "../Supabase";

export const Student = () => {
  const [studentData, setStudentData] = useState(null);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const docValue = watch("student.documento");

  // 🧩 Limpiar datos si el documento se borra (ej. al resetear el formulario)
  useEffect(() => {
    if (!docValue || docValue.trim() === "") {
      setStudentData(null);
    }
  }, [docValue]);

  // 🔍 Buscar estudiante por documento
  const readStudentData = async (doc) => {
    if (!doc || doc.trim().length < 5) {
      setStudentData(null);
      return; // evita búsquedas con menos de 5 caracteres
    }

    const { data: student, error } = await Supabase.from("students")
      .select("*")
      .eq("document_student", doc)
      .maybeSingle(); // devuelve un único registro o null

    if (error) {
      console.error("Error al leer estudiante:", error);
      setStudentData(null);
      return;
    }

    setStudentData(student || null);
  };

  // 🧩 Actualiza los campos del formulario cuando cambie studentData
  useEffect(() => {
    if (studentData) {
      setValue("student.nombres", studentData.name_student || "");
      setValue("student.apellidos", studentData.lastName_student || "");
      setValue("student.grado", studentData.grade_student || "");
      setValue("student.nacimiento", studentData.date_student || "");
      
      const rawAddress = studentData.addres_student || "";
      const parts = rawAddress.split(/\s*-\s*/);
      setValue("student.direccion", parts[0] || "");
      setValue("student.barrio", parts[1] || "");
    } else {
      // Limpia todos los campos si no hay resultados
      setValue("student.nombres", "");
      setValue("student.apellidos", "");
      setValue("student.grado", "");
      setValue("student.nacimiento", "");
      setValue("student.direccion", "");
      setValue("student.barrio", "");
    }
  }, [studentData, setValue]);

  return (
    <div className="bg-white dark:bg-slate-800 w-full p-6 md:p-10 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700/50 transition-all duration-300">
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-green-50 dark:bg-slate-900 rounded-lg text-Sam dark:text-green-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Datos del Estudiante</h3>
      </div>
      
      <hr className="my-6 border-gray-100 dark:border-slate-700" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Nombres Completos */}
        <div>
          <label htmlFor="student-nombres" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Nombres Completos
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
            type="text"
            id="student-nombres"
            {...register("student.nombres", { required: "Campo obligatorio" })}
          />
          {errors.student?.nombres && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.student.nombres.message}</p>
          )}
        </div>

        {/* Apellidos Completos */}
        <div>
          <label htmlFor="student-apellidos" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Apellidos Completos
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
            type="text"
            id="student-apellidos"
            {...register("student.apellidos", { required: "Campo obligatorio" })}
          />
          {errors.student?.apellidos && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.student.apellidos.message}</p>
          )}
        </div>

        {/* Tipo de Identificación */}
        <div>
          <label htmlFor="student-tipo-documento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Tipo de Identificación
          </label>
          <select
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            id="student-tipo-documento"
            {...register("student.tipoDocumento", { required: "Campo obligatorio" })}
          >
            <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
            <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
            <option value="Registro Civil">Registro Civil</option>
            <option value="Cédula de Extranjería">Cédula de Extranjería</option>
          </select>
          {errors.student?.tipoDocumento && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.student.tipoDocumento.message}</p>
          )}
        </div>

        {/* Número de Identificación */}
        <div>
          <label htmlFor="student-documento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Número de Identificación
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            type="text"
            id="student-documento"
            {...register("student.documento", {
              required: "Campo obligatorio",
              onBlur: (e) => readStudentData(e.target.value),
            })}
          />
          {errors.student?.documento && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.student.documento.message}</p>
          )}
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label htmlFor="student-nacimiento" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Fecha de Nacimiento
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            type="date"
            id="student-nacimiento"
            {...register("student.nacimiento", { required: "Campo obligatorio" })}
          />
          {errors.student?.nacimiento && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.student.nacimiento.message}</p>
          )}
        </div>

        {/* Grado a Cursar */}
        <div>
          <label htmlFor="student-grado" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Grado a Cursar
          </label>
          <select
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none transition-all font-medium"
            id="student-grado"
            {...register("student.grado", { required: "Campo obligatorio" })}
          >
            <option value="">Seleccione el grado</option>
            <option value="primero">Primero</option>
            <option value="segundo">Segundo</option>
            <option value="tercero">Tercero</option>
            <option value="cuarto">Cuarto</option>
            <option value="quinto">Quinto</option>
            <option value="sexto">Sexto Grado</option>
            <option value="septimo">Séptimo Grado</option>
            <option value="octavo">Octavo Grado</option>
            <option value="noveno">Noveno Grado</option>
            <option value="decimo">Décimo Grado</option>
            <option value="once">Once Grado</option>
          </select>
          {errors.student?.grado && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.student.grado.message}</p>
          )}
        </div>

        {/* Dirección de Residencia */}
        <div>
          <label htmlFor="student-direccion" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Dirección de Residencia
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
            type="text"
            id="student-direccion"
            {...register("student.direccion", { required: "Campo obligatorio" })}
          />
          {errors.student?.direccion && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.student.direccion.message}</p>
          )}
        </div>

        {/* Barrio */}
        <div>
          <label htmlFor="student-barrio" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
            Barrio
          </label>
          <input
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2.5 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam dark:focus:ring-green-400 focus:border-transparent outline-none uppercase transition-all font-medium"
            type="text"
            id="student-barrio"
            {...register("student.barrio", { required: "Campo obligatorio" })}
          />
          {errors.student?.barrio && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.student.barrio.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};
