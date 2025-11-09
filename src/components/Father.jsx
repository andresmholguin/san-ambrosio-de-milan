import { useForm } from "react-hook-form";

export const Father = () => {
  const { register } = useForm();
  return (
    <div className="my-4 bg-gray-200 w-full p-4 xl:py-12 rounded-2xl  xl:px-20">
      <h2 className="text-[1.3rem] text-Sam font-semibold">Datos del Padre:</h2>
      <hr className="my-4 text-Sam" />
      <form action="" className="flex flex-col gap-2 justify-between">
        <div className="md:flex md:gap-3">
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
        <div className="md:flex md:gap-3">
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
            <label htmlFor="email">Correo electrónico:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="email"
              id="apellidos"
              {...register("email")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="phone">Número de celular</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="number"
              id="phone"
              {...register("phone")}
            />
          </div>
        </div>
        <div className="md:flex md:gap-3">
          <div className="w-full">
            <label htmlFor="dirección">Dirección de Residencia:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="dirección"
              {...register("dirección")}
            />
          </div>
        </div>
      </form>
    </div>
  );
};
