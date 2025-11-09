import { useForm } from "react-hook-form";

export const Estudent = () => {
  const { register } = useForm();
  return (
    <div className="my-8 bg-blue-50 w-full p-4 xl:py-12 rounded-2xl  xl:px-20">
      <h2 className="text-[1.3rem] text-Sam font-semibold">
        Datos del Estudiante:
      </h2>
      <hr className="my-4 text-Sam" />
      <form action="" className="flex flex-col gap-2 justify-between">
        <div className="xl:flex xl:gap-3">
          <div className="w-full">
            <label htmlFor="documento">Documento de identidad:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="documento"
              {...register("documento")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="nombres">Nombres:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="nombres"
              {...register("nombres")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="apellidos">Apellidos:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="apellidos"
              {...register("apellidos")}
            />
          </div>
        </div>
        <div className="xl:flex xl:gap-3">
          <div className="w-full">
            <label htmlFor="nacimiento">Fecha de Nacimiento:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="date"
              id="nacimiento"
              {...register("nacimiento")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="grado">Grado Actual:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="grado"
              {...register("grado")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="dirección">Dirección de Residencia:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="dirección"
              {...register("nombres")}
            />
          </div>
        </div>
      </form>
    </div>
  );
};
