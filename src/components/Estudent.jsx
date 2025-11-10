import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import Supabase from "../Supabase";

export const Estudent = () => {
  const [document, setDocument] = useState("");
  const [studentData, setStudentData] = useState(null);

  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext();

  // 🔍 Buscar estudiante por documento
  const readStudentData = async (doc) => {
    if (!doc || doc.trim().length < 5) return; // evita búsquedas con menos de 5 caracteres

    const { data: students, error } = await Supabase.from("students")
      .select("*")
      .eq("document_student", doc)
      .maybeSingle(); // devuelve un único registro o null

    if (error) {
      console.error("Error al leer estudiante:", error);
      setStudentData(null);
      return;
    }

    setStudentData(students || null);
  };

  // ⏳ Espera un poco antes de consultar (debounce)
  useEffect(() => {
    const delay = setTimeout(() => {
      console.log("inicio busqueda estudiante");
      readStudentData(document);
    }, 500);
    return () => clearTimeout(delay);
  }, [document]);

  // 🧩 Actualiza los campos del formulario cuando cambie studentData
  useEffect(() => {
    if (studentData) {
      setValue("student.nombres", studentData.name_student || "");
      setValue("student.apellidos", studentData.lastName_student || "");
      setValue("student.grado", studentData.grade_student || "");
      setValue("student.nacimiento", studentData.date_student || "");
      setValue("student.direccion", studentData.addres_student || "");
    } else {
      // Limpia si no hay resultados
      setValue("student.nombres", "");
      setValue("student.apellidos", "");
      setValue("student.grado", "");
    }
  }, [studentData, setValue]);

  return (
    <div className="my-4 bg-gray-200 w-full p-4 xl:py-12 rounded-2xl  xl:px-20">
      <h2 className="text-[1.3rem] text-Sam font-semibold">
        Datos del Estudiante:
      </h2>
      <hr className="my-4 text-Sam" />
      <div className="flex flex-col gap-2 justify-between">
        <div className="md:flex md:gap-3">
          <div className="w-full">
            <label htmlFor="documento">Documento de identidad:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="documento"
              {...register("student.documento", {
                required: true,
                onBlur: (e) => setDocument(e.target.value),
              })}
            />
            {errors.student?.documento && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="nombres">Nombres:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 uppercase"
              type="text"
              id="nombres"
              {...register("student.nombres", { required: true })}
            />
            {errors.student?.nombres && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="apellidos">Apellidos:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 uppercase"
              type="text"
              id="apellidos"
              {...register("student.apellidos", { required: true })}
            />
            {errors.student?.apellidos && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
        </div>
        <div className="md:flex md:gap-3">
          <div className="w-full">
            <label htmlFor="nacimiento">Fecha de Nacimiento:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="date"
              id="nacimiento"
              {...register("student.nacimiento", { required: true })}
            />
            {errors.student?.nacimiento && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full ">
            <label htmlFor="grado">Grado Actual:</label>
            <select
              className="bg-white p-2 w-full rounded-md my-2"
              id="grado"
              {...register("student.grado", { required: true })}
            >
              <option value="">Seleccione el grado</option>
              <option value="primero">Primero</option>
              <option value="segundo">Segundo</option>
              <option value="tercero">Tercero</option>
              <option value="cuarto">Cuarto</option>
              <option value="quinto">Quinto</option>
              <option value="sexto1">Sexto - 1</option>
              <option value="sexto2">Sexto - 2</option>
              <option value="septimo1">Séptimo - 1</option>
              <option value="septimo2">Séptimo - 2</option>
              <option value="octavo">Octavo</option>
              <option value="noveno">Noveno</option>
              <option value="decimo">Décimo</option>
              <option value="once">Once</option>
            </select>
            {errors.student?.grado && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="direccion">Dirección de Residencia:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 uppercase"
              type="text"
              id="dirección"
              {...register("student.direccion", { required: true })}
            />
            {errors.student?.direccion && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
