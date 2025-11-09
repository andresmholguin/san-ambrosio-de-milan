import { useFormContext } from "react-hook-form";

export const Mother = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
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
              {...register("mother.documento", { required: true })}
            />
            {errors.mother?.documento && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="nombres">Nombres:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="nombres"
              {...register("mother.nombres", { required: true })}
            />
            {errors.mother?.nombres && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="apellidos">Apellidos:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="apellidos"
              {...register("mother.apellidos", { required: true })}
            />
            {errors.mother?.apellidos && (
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
              {...register("mother.nacimiento", { required: true })}
            />
            {errors.mother?.nacimiento && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="email">Correo electrónico:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="email"
              id="apellidos"
              {...register("mother.email", { required: true })}
            />
            {errors.mother?.email && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="phone">Número de celular</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="number"
              id="phone"
              {...register("mother.phone", { required: true })}
            />
            {errors.mother?.phone && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
        </div>
        <div className="md:flex md:gap-3">
          <div className="w-full">
            <label htmlFor="dirección">Dirección de Residencia:</label>
            <input
              className="bg-white p-2 w-full rounded-md my-2"
              type="text"
              id="dirección"
              {...register("mother.dirección", { required: true })}
            />
            {errors.mother?.dirección && (
              <p className="text-red-500 text-sm">Campo obligatorio</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
