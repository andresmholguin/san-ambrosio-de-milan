import "./index.css";

import { Header } from "./components/Header";
import { Estudent } from "./components/Estudent";

function App() {
  return (
    <>
      <div className="flex justify-center items-center flex-col w-[360px] md:w-[760px] xl:w-[1040px] ">
        <Header />
        <Estudent />
      </div>
    </>
  );
}

export default App;
