import "./index.css";

import { Header } from "./components/Header";
import { Estudent } from "./components/Estudent";
import { Father } from "./components/Father";
import { Mother } from "./components/Mother";
import { Attendant } from "./components/Attendant";

function App() {
  return (
    <>
      <div className="flex justify-center items-center flex-col w-[360px] md:w-[760px] xl:w-[1040px] ">
        <Header />
        <Estudent />
        <Father />
        <Mother />
        <Attendant />
      </div>
    </>
  );
}

export default App;
