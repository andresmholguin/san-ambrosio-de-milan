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
      student: { direccion: "" },
      father: { direccion: "" },
      mother: { direccion: "" },
      attendant: { direccion: "" },
    },
  });

  const { handleSubmit, watch, setValue, reset } = methods;

  // 🔥 Sincronizar direcciones correctamente
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "student.direccion") {
        const dir = value.student.direccion;
        setValue("father.direccion", dir);
        setValue("mother.direccion", dir);
        setValue("attendant.direccion", dir);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // ---------------------------------------------------
  //                 SUBMIT PRINCIPAL
  // ---------------------------------------------------
  const onSubmit = async (data) => {
    if (
      !data.father.documento &&
      !data.mother.documento &&
      !data.attendant.documento
    ) {
      alert("Debe registrar al menos un acudiente (padre, madre o acudiente).");
    } else {
      console.log("Datos del formulario:", data);

      // ---------------------- PADRE ----------------------
      const insertFather = async () => {
        if (data.father.documento) {
          const { data: fatherExist } = await Supabase.from("fathers")
            .select("*")
            .eq("document_father", data.father.documento)
            .maybeSingle();

          // if (error) {
          //   alert("Error consultando al padre");
          //   return;
          // }

          if (fatherExist) {
            console.log("El padre ya está registrado.");
          } else {
            const father = {
              document_father: data.father.documento.toUpperCase().trim(),
              name_father: data.father.nombres.toUpperCase().trim(),
              lastName_father: data.father.apellidos.toUpperCase().trim(),
              date_father: data.father.nacimiento,
              email_father: data.father.email.trim(),
              phone_father: data.father.phone.trim(),
              addres_father: data.father.direccion.toUpperCase().trim(),
            };

            const { error: errorFather } = await Supabase.from(
              "fathers"
            ).insert([father]);

            if (errorFather) {
              alert("No se pudo registrar el padre.");
              return;
            }
            console.log("Padre registrado correctamente.");
          }
        }
      };

      // ---------------------- MADRE ----------------------
      const insertMother = async () => {
        if (data.mother.documento) {
          const { data: motherExist } = await Supabase.from("mothers")
            .select("*")
            .eq("document_mother", data.mother.documento)
            .maybeSingle();

          // if (error) {
          //   alert("Error consultando a la madre");
          //   return;
          // }

          if (motherExist) {
            console.log("La madre ya está registrada.");
          } else {
            const mother = {
              document_mother: data.mother.documento.toUpperCase().trim(),
              name_mother: data.mother.nombres.toUpperCase().trim(),
              lastName_mother: data.mother.apellidos.toUpperCase().trim(),
              date_mother: data.mother.nacimiento,
              email_mother: data.mother.email.trim(),
              phone_mother: data.mother.phone.trim(),
              addres_mother: data.mother.direccion.toUpperCase().trim(),
            };

            const { error: errorMother } = await Supabase.from(
              "mothers"
            ).insert([mother]);

            if (errorMother) {
              alert("No se pudo registrar la madre.");
              return;
            }
            console.log("Madre registrado correctamente.");
          }
        }
      };

      // ---------------------- ACUDIENTE ----------------------
      const insertAttendant = async () => {
        if (data.attendant.select === "otro" && data.attendant.documento) {
          const { data: attendantExist } = await Supabase.from("attendant")
            .select("*")
            .eq("document_attendant", data.attendant.documento)
            .maybeSingle();

          // if (error) {
          //   alert("Error consultando al acudiente");
          //   return;
          // }

          if (attendantExist) {
            console.log("El acudiente ya está registrado.");
          } else {
            const attendant = {
              document_attendant: data.attendant.documento.toUpperCase().trim(),
              name_attendant: data.attendant.nombres.toUpperCase().trim(),
              lastName_attendant: data.attendant.apellidos.toUpperCase().trim(),
              relationship_attendant: data.attendant.parentesco
                .toUpperCase()
                .trim(),
              email_attendant: data.attendant.email.trim(),
              phone_attendant: data.attendant.phone.trim(),
              addres_attendant: data.attendant.direccion.toUpperCase().trim(),
            };

            const { error: errorAttendant } = await Supabase.from(
              "attendant"
            ).insert([attendant]);

            if (errorAttendant) {
              alert("No se pudo registrar el acudiente.");
              return;
            }
            console.log("Acudiente registrado correctamente.");
          }
        }
      };

      // ---------------------- ESTUDIANTE ----------------------
      if (data.student.documento) {
        const { data: studentExist } = await Supabase.from("students")
          .select("*")
          .eq("document_student", data.student.documento)
          .maybeSingle();

        // if (error) {
        //   alert("Error consultando al estudiante");
        //   return;
        // }

        if (studentExist) {
          alert("El estudiante ya está registrado.");
          return;
        } else {
          insertFather();
          insertMother();
          insertAttendant();
          const student = {
            document_student: data.student.documento.toUpperCase().trim(),
            name_student: data.student.nombres.toUpperCase().trim(),
            lastName_student: data.student.apellidos.toUpperCase().trim(),
            date_student: data.student.nacimiento,
            addres_student: data.student.direccion.toUpperCase().trim(),
            grade_student: data.student.grado.trim(),
            attendant: data.attendant.select.trim(),
            id_father: data.father.documento || null,
            id_mother: data.mother.documento || null,
            id_attendant: data.attendant.documento || null,
          };

          const { error: errorStudent } = await Supabase.from(
            "students"
          ).insert([student]);

          if (errorStudent) {
            alert("No se pudo registrar el estudiante.");
            return;
          } else {
            console.log("Estudiante registrado correctamente.");
          }
        }

        alert("Datos agregados correctamente!");
        reset();
        window.location.reload();
      }
    }
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
