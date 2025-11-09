import logo from "/SAM.svg";
export const Header = () => {
  return (
    <>
      <div className="flex justify-center items-center  py-6 md:h-60 bg-green-100 gap-2 rounded-b-3xl w-full">
        <img className="w-20 lg:w-40" src={logo} alt="Logo SAM" />
        <div className="flex flex-col items-center  justify-center text-[1.3rem] md:text-[2rem] lg:text-[3rem] text-Sam font-semibold">
          <span>Colegio</span>
          <span className="text-center ">San Ambrosio de Milán</span>
        </div>
      </div>
      <h1 className="text-[1.5rem] md:text-[2.5rem] mt-4 font-bold">
        Actualización de datos
      </h1>
      <p className="md:text-[1.5rem]">Complete todos los campos</p>
    </>
  );
};
