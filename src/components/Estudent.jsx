import { useForm } from "react-hook-form";

export const Estudent = () => {
  const { register } = useForm();
  return (
    <div className="my-8 bg-blue-50 w-full p-4 rounded-2xl  xl:px-20">
      <h2 className="text-[1.3rem] text-Sam font-semibold">
        Datos del Estudiante:
      </h2>
      <hr className="my-4 text-Sam" />
      <form action="" className="flex flex-wrap gap-2 justify-between">
        <div>
          <label htmlFor="documento">Documento de identidad:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            {...register("documento")}
          />
        </div>
        <div>
          <label htmlFor="documento">Nombre Completo</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            {...register("documento")}
          />
        </div>
      </form>
    </div>
  );
};
