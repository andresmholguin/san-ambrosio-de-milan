export const Header = ({ theme, setTheme }) => {
  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3.5 px-6 md:px-12 flex justify-between items-center transition-colors duration-300">
      {/* Izquierda: Logotipo y Nombre */}
      <div className="flex items-center gap-2">
        <div className="text-Sam dark:text-green-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M4.5 12.062v3.344a1.2 1.2 0 00.672 1.077L12 20"></path>
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
          </svg>
        </div>
        <span className="font-bold text-[#0e704d] dark:text-green-400 text-lg tracking-tight select-none">
          Colegio San Ambrosio
        </span>
      </div>

      {/* Centro: Título general (Oculto en móvil) */}
      <div className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider hidden md:block select-none">
        Actualización de Datos
      </div>

      {/* Derecha: Conmutador de tema y Botón Inscripción */}
      <div className="flex items-center gap-3">
        {/* Toggle Dark Mode */}
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-all cursor-pointer"
          aria-label="Alternar tema"
        >
          {theme === "light" ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path>
            </svg>
          )}
        </button>

        {/* Botón Inscríbete */}
        <button
          type="button"
          className="bg-Sam hover:bg-green-700 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Inscríbete
        </button>
      </div>
    </header>
  );
};
