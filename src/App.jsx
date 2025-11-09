import "./index.css";
import { useForm, FormProvider } from "react-hook-form";

import { Header } from "./components/Header";
import { Estudent } from "./components/Estudent";
import { Father } from "./components/Father";
import { Mother } from "./components/Mother";
import { Attendant } from "./components/Attendant";

function App() {
  const methods = useForm();
  const { handleSubmit } = methods;

  const onSubmit = (data) => {
    console.log("Datos del formulario:", data);
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
