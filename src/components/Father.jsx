import { useFormContext } from "react-hook-form";

export const Father = () => {
  const { register } = useFormContext();
  return (
    <div className="my-4 bg-gray-200 w-full p-4 xl:py-12 rounded-2xl  xl:px-20">
      <h2 className="text-[1.3rem] text-Sam font-semibold">Datos del Padre:</h2>
      <hr className="my-4 text-Sam" />
      <div className="flex flex-col gap-2 justify-between">
        <div className="md:flex md:gap-3">
          <div className="w-full">
            <label htmlFor="documento">Documento de identidad:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="documento"
              {...register("father.documento")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="nombres">Nombres:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 uppercase"
              type="text"
              id="nombres"
              {...register("father.nombres")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="apellidos">Apellidos:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 uppercase"
              type="text"
              id="apellidos"
              {...register("father.apellidos")}
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
              {...register("father.nacimiento")}
            />
          </div>
          <div className="w-full">
            <label htmlFor="email">Correo electrónico:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2 lowercase"
              type="email"
              id="apellidos"
              {...register("father.email", {
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
              type="tel"
              id="phone"
              {...register("father.phone")}
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
              {...register("father.direccion")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
