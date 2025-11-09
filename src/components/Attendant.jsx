import { FormAttendant } from "./FormAttendant.jsx";
import { useFormContext } from "react-hook-form";

export const Attendant = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const attendantSelect = watch("attendant.select");

  return (
    <div className="my-4 bg-gray-200 w-full p-4 xl:py-12 rounded-2xl  xl:px-20">
      <div className="flex flex-row items-center gap-4">
        <h2 className="text-[1.3rem] text-Sam font-semibold">Acudiente:</h2>
        <select
          className="bg-white py-1 ml-4 w-50 rounded-md my-2"
          name="attendant"
          id="attendant"
          {...register("attendant.select", { required: true })}
        >
          Acudiente
          <option value="">Seleccione</option>
          <option value="padre">Padre</option>
          <option value="madre">Madre</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      {errors.attendant?.select && (
        <p className="text-red-500 text-sm">Campo obligatorio</p>
      )}
      <hr className="my-4 text-Sam" />
      {attendantSelect === "otro" && <FormAttendant />}
    </div>
  );
};
