import "./index.css";
import { useForm, FormProvider } from "react-hook-form";

import { Header } from "./components/Header";
import { Estudent } from "./components/Estudent";
import { Father } from "./components/Father";
import { Mother } from "./components/Mother";
import { Attendant } from "./components/Attendant";
import { useEffect } from "react";
import Supabase from "./Supabase";

function App() {
  const methods = useForm({
    defaultValues: {
      student: {
        direccion: "",
      },
      father: {
        direccion: "",
      },
      mother: {
        direccion: "",
      },
      attendant: {
        direccion: "",
      },
    },
  });
  const { handleSubmit, watch, setValue, reset } = methods;

  useEffect(() => {
    const studentDireccion = watch("student.direccion");
    setValue("father.direccion", studentDireccion);
    setValue("mother.direccion", studentDireccion);
    setValue("attendant.direccion", studentDireccion);
  }, [watch("student.direccion")]);

  const onSubmit = async (data) => {
    console.log("Datos del formulario:", data);

    const father = {
      document_father: data.father.documento.toUpperCase(),
      name_father: data.father.nombres.toUpperCase(),
      lastName_father: data.father.apellidos.toUpperCase(),
      date_father: data.father.nacimiento,
      email_father: data.father.email,
      phone_father: data.father.phone,
      addres_father: data.father.direccion.toUpperCase(),
    };

    const mother = {
      document_mother: data.mother.documento,
      name_mother: data.mother.nombres.toUpperCase(),
      lastName_mother: data.mother.apellidos.toUpperCase(),
      date_mother: data.mother.nacimiento,
      email_mother: data.mother.email,
      phone_mother: data.mother.phone,
      addres_mother: data.mother.direccion.toUpperCase(),
    };

    if (data.attendant.select === "otro") {
      const attendant = {
        document_attendant: data.attendant.documento,
        name_attendant: data.attendant.nombres.toUpperCase(),
        lastName_attendant: data.attendant.apellidos.toUpperCase(),
        relationship_attendant: data.attendant.parentesco.toUpperCase(),
        email_attendant: data.attendant.email,
        phone_attendant: data.attendant.phone,
        addres_attendant: data.attendant.direccion.toUpperCase(),
      };
      const { errorAttendant } = await Supabase.from("attendant")
        .insert([attendant])
        .select();
      if (errorAttendant) {
        // console.log("Error inserting data:", errorAttendant);
        alert("No se pudo registrar el asistente.", errorAttendant);
      }
    }

    const student = {
      document_student: data.student.documento,
      name_student: data.student.nombres.toUpperCase(),
      lastName_student: data.student.apellidos.toUpperCase(),
      date_student: data.student.nacimiento,
      addres_student: data.student.direccion.toUpperCase(),
      grade_student: data.student.grado,
      attendant: data.attendant.select,
      id_father: data.father.documento,
      id_mother: data.mother.documento,
      id_attendant: data.attendant.documento ? data.attendant.documento : null,
    };

    const { errorFather } = await Supabase.from("fathers")
      .insert([father])
      .select();
    if (errorFather) {
      // console.log("Error inserting data:", errorFather);
      alert("No se pudo registrar el asistente.", errorFather);
    }

    const { errorMother } = await Supabase.from("mothers")
      .insert([mother])
      .select();
    if (errorMother) {
      // console.log("Error inserting data:", errorMother);
      alert("No se pudo registrar el asistente.", errorMother);
    }

    const { errorStudent } = await Supabase.from("students")
      .insert([student])
      .select();
    if (errorStudent) {
      // console.log("Error inserting data:", errorStudent);
      alert("No se pudo registrar el asistente.", errorStudent);
    }

    alert("Datos actualizados!");

    reset();
  };
  return (
    <>
      <div className="flex justify-center items-center flex-col w-[360px] md:w-[760px] xl:w-[1040px]">
        <Header />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Estudent />
            <Father />
            <Mother />
            <Attendant />
            <button className="bg-Sam text-white w-full p-2 rounded-lg font-semibold cursor-pointer hover:bg-Sams hover:text-Sam hover:shadow-lg shadow-Sam/60 transition-all duration-300 mb-6 ">
              Guardar
            </button>
          </form>
        </FormProvider>
      </div>
    </>
  );
}

export default App;
