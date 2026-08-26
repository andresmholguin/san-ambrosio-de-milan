export const Footer = () => {
  return (
    <footer className="w-full bg-[#1e293b] text-slate-300 dark:bg-slate-950 py-12 px-6 mt-16 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna 1: Info Colegio */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-white">Colegio San Ambrosio de Milan</h3>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Formando líderes para el futuro con excelencia académica y valores institucionales.
          </p>
        </div>

        {/* Columna 2: Enlaces rápidos */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Navegación</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            <li><a href="/" className="hover:text-white transition-colors">Inicio</a></li>
            <li><a href="https://colegiosanambrosiodemilan.edu.co/nosotros/" className="hover:text-white transition-colors">Nosotros</a></li>
            <li><a href="https://colegiosanambrosiodemilan.edu.co/inscripciones/" className="hover:text-white transition-colors">Inscripciones</a></li>
            <li><a href="https://colegiosanambrosiodemilan.edu.co/noticias/" className="hover:text-white transition-colors">Noticias</a></li>
            <li><a href="https://colegiosanambrosiodemilan.edu.co/contacto/" className="hover:text-white transition-colors">Contacto</a></li>
            {/* <li><a href="#" className="hover:text-white transition-colors">Aviso de Privacidad</a></li> */}
          </ul>
        </div>

        {/* Columna 3: Contacto e Iconos */}
        <div className="flex flex-col gap-3 items-start md:items-end justify-between">
          <div className="flex gap-4">
            {/* Icono de Sombrero de Graduación */}
            <svg className="w-6 h-6 text-slate-400 hover:text-white transition-colors cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M4.5 12.062v3.344a1.2 1.2 0 00.672 1.077L12 20"></path>
            </svg>
            {/* Icono de Sobre/Correo */}
            <svg className="w-6 h-6 text-slate-400 hover:text-white transition-colors cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-700/50 text-center text-xs text-slate-500">
        <p>© 2024 Colegio San Ambrosio de Milán. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};
