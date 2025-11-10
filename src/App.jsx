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

    if (data.father.documento) {
      const father = {
        document_father: data.father.documento.toUpperCase().trim(),
        name_father: data.father.nombres.toUpperCase().trim(),
        lastName_father: data.father.apellidos.toUpperCase().trim(),
        date_father: data.father.nacimiento,
        email_father: data.father.email.trim(),
        phone_father: data.father.phone.trim(),
        addres_father: data.father.direccion.toUpperCase().trim(),
      };
      const { errorFather } = await Supabase.from("fathers")
        .insert([father])
        .select();
      if (errorFather) {
        // console.log("Error inserting data:", errorFather);
        alert("No se pudo registrar el asistente.", errorFather);
      }
    }

    if (data.mother.documento) {
      const mother = {
        document_mother: data.mother.documento.toUpperCase().trim(),
        name_mother: data.mother.nombres.toUpperCase().trim(),
        lastName_mother: data.mother.apellidos.toUpperCase().trim(),
        date_mother: data.mother.nacimiento,
        email_mother: data.mother.email.trim(),
        phone_mother: data.mother.phone.trim(),
        addres_mother: data.mother.direccion.toUpperCase().trim(),
      };
      const { errorMother } = await Supabase.from("mothers")
        .insert([mother])
        .select();
      if (errorMother) {
        // console.log("Error inserting data:", errorMother);
        alert("No se pudo registrar el asistente.", errorMother);
      }
    }

    if (data.attendant.select === "otro") {
      const attendant = {
        document_attendant: data.attendant.documento.toUpperCase().trim(),
        name_attendant: data.attendant.nombres.toUpperCase().trim(),
        lastName_attendant: data.attendant.apellidos.toUpperCase().trim(),
        relationship_attendant: data.attendant.parentesco.toUpperCase().trim(),
        email_attendant: data.attendant.email.trim(),
        phone_attendant: data.attendant.phone.trim(),
        addres_attendant: data.attendant.direccion.toUpperCase().trim(),
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
      document_student: data.student.documento.toUpperCase().trim(),
      name_student: data.student.nombres.toUpperCase().trim(),
      lastName_student: data.student.apellidos.toUpperCase().trim(),
      date_student: data.student.nacimiento,
      addres_student: data.student.direccion.toUpperCase().trim(),
      grade_student: data.student.grado.trim(),
      attendant: data.attendant.select.trim(),
      id_father: data.father.documento,
      id_mother: data.mother.documento,
      id_attendant: data.attendant.documento ? data.attendant.documento : null,
    };

    const { errorStudent } = await Supabase.from("students")
      .insert([student])
      .select();
    if (errorStudent) {
      // console.log("Error inserting data:", errorStudent);
      alert("No se pudo registrar el asistente.", errorStudent);
    }

    alert("Datos agregados!");

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
