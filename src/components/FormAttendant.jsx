import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import Supabase from "../Supabase";

export const FormAttendant = () => {
  const [document, setDocument] = useState("");
  const [attendantData, setAttendantData] = useState(null);

  const { register, setValue } = useFormContext();

  // 🔍 Buscar estudiante por documento
  const readAttendantData = async (doc) => {
    if (!doc || doc.trim().length < 5) return; // evita búsquedas con menos de 5 caracteres

    const { data: attendant, error } = await Supabase.from("attendant")
      .select("*")
      .eq("document_attendant", doc)
      .maybeSingle(); // devuelve un único registro o null

    if (error) {
      console.error("Error al leer acompañante:", error);
      setAttendantData(null);
      return;
    }

    setAttendantData(attendant || null);
  };

  // ⏳ Espera un poco antes de consultar (debounce)
  useEffect(() => {
    if (!document || document.trim() === "") return;
    const delay = setTimeout(() => {
      console.log("inicio busqueda Acompañante");
      readAttendantData(document);
    }, 100);
    return () => clearTimeout(delay);
  }, [document]);

  // 🧩 Actualiza los campos del formulario cuando cambie studentData
  useEffect(() => {
    if (attendantData) {
      setValue("attendant.nombres", attendantData.name_attendant || "");
      setValue("attendant.apellidos", attendantData.lastName_attendant || "");
      setValue("attendant.email", attendantData.email_attendant || "");
      setValue("attendant.nacimiento", attendantData.date_attendant || "");
      setValue("attendant.direccion", attendantData.addres_attendant || "");
      setValue("attendant.phone", attendantData.phone_attendant || "");
    } else {
      // Limpia si no hay resultados
      setValue("attendant.nombres", "");
      setValue("attendant.apellidos", "");
      setValue("attendant.grado", "");
    }
  }, [attendantData, setValue]);
  return (
    <div className="flex flex-col gap-2 justify-between">
      <div className="md:flex md:gap-3">
        <div className="w-full">
          <label htmlFor="documento">Documento de identidad:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            id="documento"
            {...register("attendant.documento", {
              onBlur: (e) => setDocument(e.target.value),
            })}
          />
        </div>
        <div className="w-full">
          <label htmlFor="nombres">Nombres:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2 uppercase"
            type="text"
            id="nombres"
            {...register("attendant.nombres")}
          />
        </div>
        <div className="w-full">
          <label htmlFor="apellidos">Apellidos:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2 uppercase"
            type="text"
            id="apellidos"
            {...register("attendant.apellidos")}
          />
        </div>
      </div>
      <div className="md:flex md:gap-3">
        <div className="w-full">
          <label htmlFor="parentesco">Parentesco con el Estudiante</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2 uppercase"
            type="text"
            id="parentesco"
            {...register("attendant.parentesco")}
          />
        </div>
        <div className="w-full">
          <label htmlFor="email">Correo electrónico:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2 lowercase"
            type="email"
            id="apellidos"
            {...register("attendant.email", {
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
            {...register("attendant.phone")}
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
            {...register("attendant.direccion")}
          />
        </div>
      </div>
    </div>
  );
};
