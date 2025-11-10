import { useFormContext } from "react-hook-form";

export const FormAttendant = () => {
  const { register } = useFormContext();
  return (
    <div className="flex flex-col gap-2 justify-between">
      <div className="md:flex md:gap-3">
        <div className="w-full">
          <label htmlFor="documento">Documento de identidad:</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            id="documento"
            {...register("attendant.documento")}
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
