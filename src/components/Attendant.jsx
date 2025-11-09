import { useState } from "react";
import { FormAttendant } from "./FormAttendant.jsx";

export const Attendant = () => {
  const [attendant, setAttendant] = useState(false);
  const handleAttendant = (e) => {
    const select = e.target.value;
    if (select === "otro") {
      setAttendant(true);
      console.log("selecciono otro", attendant);
    } else {
      setAttendant(false);
      console.log("selecciono madre o padre", attendant);
    }
  };
  return (
    <div className="my-4 bg-gray-200 w-full p-4 xl:py-12 rounded-2xl  xl:px-20">
      <div className="flex flex-row items-center gap-4">
        <h2 className="text-[1.3rem] text-Sam font-semibold">Acudiente:</h2>
        <select
          onChange={handleAttendant}
          className="bg-white py-1 ml-4 w-50 rounded-md my-2"
          name="attendant"
          id="attendant"
        >
          Acudiente
          <option value="">Seleccione</option>
          <option value="padre">Padre</option>
          <option value="madre">Madre</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <hr className="my-4 text-Sam" />
      {attendant ? <FormAttendant /> : ""}
    </div>
  );
};
