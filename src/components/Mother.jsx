import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import Supabase from "../Supabase";

export const Mother = () => {
  const [document, setDocument] = useState("");
  const [motherData, setMotherData] = useState(null);

  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext();

  // 🔍 Buscar estudiante por documento
  const readMotherData = async (doc) => {
    if (!doc || doc.trim().length < 5) return; // evita búsquedas con menos de 5 caracteres

    const { data: mother, error } = await Supabase.from("mothers")
      .select("*")
      .eq("document_mother", doc)
      .maybeSingle(); // devuelve un único registro o null

    if (error) {
      console.error("Error al leer madre:", error);
      setMotherData(null);
      return;
    }

    setMotherData(mother || null);
  };

  // ⏳ Espera un poco antes de consultar (debounce)
  useEffect(() => {
    const delay = setTimeout(() => {
      console.log("inicio busqueda estudiante");
      readMotherData(document);
    }, 100);
    return () => clearTimeout(delay);
  }, [document]);

  // 🧩 Actualiza los campos del formulario cuando cambie studentData
  useEffect(() => {
    if (motherData) {
      setValue("mother.nombres", motherData.name_mother || "");
      setValue("mother.apellidos", motherData.lastName_mother || "");
      setValue("mother.email", motherData.email_mother || "");
      setValue("mother.nacimiento", motherData.date_mother || "");
      setValue("mother.direccion", motherData.addres_mother || "");
      setValue("mother.phone", motherData.phone_mother || "");
    } else {
      // Limpia si no hay resultados
      setValue("mother.nombres", "");
      setValue("mother.apellidos", "");
      setValue("mother.grado", "");
    }
  }, [motherData, setValue]);
  return (
    <div className="my-4 bg-gray-200 w-full p-4 xl:py-12 rounded-2xl  xl:px-20">
      <h2 className="text-[1.3rem] text-Sam font-semibold">
        Datos de la Madre:
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
              {...register("mother.documento", {
                required: true,
                onBlur: (e) => setDocument(e.target.value),
              })}
            />
            {errors.father?.documento && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="nombres">Nombres:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 uppercase"
              type="text"
              id="nombres"
              {...register("mother.nombres")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="apellidos">Apellidos:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 uppercase"
              type="text"
              id="apellidos"
              {...register("mother.apellidos")}
            />
          </div>
        </div>
        <div className="md:flex md:gap-3">
          <div className="w-full">
            <label htmlFor="nacimiento">Fecha de Nacimiento:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="date"
              id="nacimiento"
              {...register("mother.nacimiento", {
                required: true,
              })}
            />
          </div>
          <div className="w-full">
            <label htmlFor="email">Correo electrónico:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 lowercase"
              type="email"
              id="apellidos"
              {...register("mother.email", {
                required: true,
                pattern: {
                  value: /^[a-z0-9._%+ -]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
                  message: "Correo inválido",
                },
              })}
            />
          </div>
          <div className="w-full">
            <label htmlFor="phone">Número de celular</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="number"
              id="phone"
              {...register("mother.phone")}
            />
          </div>
        </div>
        <div className="md:flex md:gap-3">
          <div className="w-full">
            <label htmlFor="direccion">Dirección de Residencia:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 uppercase"
              type="text"
              id="dirección"
              {...register("mother.direccion")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
