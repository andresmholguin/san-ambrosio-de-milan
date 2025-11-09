import { useFormContext } from "react-hook-form";

export const Father = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
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
              {...register("father.documento", { required: true })}
            />
            {errors.father?.documento && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="nombres">Nombres:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="nombres"
              {...register("father.nombres", { required: true })}
            />
            {errors.father?.nombres && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="apellidos">Apellidos:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="apellidos"
              {...register("father.apellidos", { required: true })}
            />
            {errors.father?.apellidos && (
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
              {...register("father.nacimiento", { required: true })}
            />
            {errors.father?.nacimiento && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="email">Correo electrónico:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="email"
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
              id="apellidos"
              {...register("father.email", {
                required: true,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.father?.email && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="phone">Número de celular</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="tel"
              id="phone"
              {...register("father.phone", { required: true })}
            />
            {errors.father?.phone && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
        </div>
        <div className="md:flex md:gap-3">
          <div className="w-full">
            <label htmlFor="direccion">Dirección de Residencia:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="dirección"
              {...register("father.direccion", { required: true })}
            />
            {errors.father?.dirección && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
