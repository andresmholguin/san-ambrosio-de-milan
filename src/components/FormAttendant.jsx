import { useFormContext } from "react-hook-form";

export const FormAttendant = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <div className="flex flex-col gap-2 justify-between">
      <div className="md:flex md:gap-3">
        <div className="w-full">
          <label htmlFor="documento">Documento de identidad:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            id="documento"
            {...register("attendant.documento", { required: true })}
          />
          {errors.attendant?.documento && (
            <p className="text-red-500 text-sm">Campo obligatorio</p>
          )}
        </div>
        <div className="w-full">
          <label htmlFor="nombres">Nombres:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            id="nombres"
            {...register("attendant.nombres", { required: true })}
          />
          {errors.attendant?.nombres && (
            <p className="text-red-500 text-sm">Campo obligatorio</p>
          )}
        </div>
        <div className="w-full">
          <label htmlFor="apellidos">Apellidos:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            id="apellidos"
            {...register("attendant.apellidos", { required: true })}
          />
          {errors.attendant?.apellidos && (
            <p className="text-red-500 text-sm">Campo obligatorio</p>
          )}
        </div>
      </div>
      <div className="md:flex md:gap-3">
        <div className="w-full">
          <label htmlFor="parentesco">Parentesco con el Estudiante</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            id="parentesco"
            {...register("attendant.parentesco", { required: true })}
          />
          {errors.attendant?.parentesco && (
            <p className="text-red-500 text-sm">Campo obligatorio</p>
          )}
        </div>
        <div className="w-full">
          <label htmlFor="email">Correo electrónico:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="email"
            id="apellidos"
            {...register("attendant.email", { required: true })}
          />
          {errors.attendant?.email && (
            <p className="text-red-500 text-sm">Campo obligatorio</p>
          )}
        </div>
        <div className="w-full">
          <label htmlFor="phone">Número de celular</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="number"
            id="phone"
            {...register("attendant.phone", { required: true })}
          />
          {errors.attendant?.phone && (
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
            {...register("attendant.direccion", { required: true })}
          />
          {errors.attendant?.direccion && (
            <p className="text-red-500 text-sm">Campo obligatorio</p>
          )}
        </div>
      </div>
    </div>
  );
};
