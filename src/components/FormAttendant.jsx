import { useForm } from "react-hook-form";

export const FormAttendant = () => {
  const { register } = useForm();
  return (
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
          <label htmlFor="parentesco">Parentesco con el Estudiante</label>
          <input
            className="bg-white p-2 w-full rounded-md my-2"
            type="text"
            id="parentesco"
            {...register("parentesco")}
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
  );
};
