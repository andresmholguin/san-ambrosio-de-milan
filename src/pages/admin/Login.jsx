import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { hashPassword } from "../../utils/crypto";
import toast from "react-hot-toast";

export default function Login() {
  const login = useAuthStore((state) => state.login);
  
  const [step, setStep] = useState(1); // 1: Documento, 2: Login normal, 3: Crear password
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!documento.trim()) return;

    setIsLoading(true);
    try {
      // Buscar el usuario por documento en la tabla "users" en Google Sheets (vía SheetDB)
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
      if (!sheetUrl) throw new Error("Falta configuración de base de datos.");

      // SheetDB Search API: /search?id_documento=123&sheet=users
      const res = await fetch(`${sheetUrl}/search?id_documento=${documento}&sheet=users`);
      if (!res.ok) throw new Error("Error al consultar el usuario.");
      
      const data = await res.json();

      if (!data || data.length === 0) {
        toast.error("El documento no se encuentra registrado como Staff.");
        setIsLoading(false);
        return;
      }

      // Tomamos el primer registro
      const user = data[0];
      setUserData(user);

      if (!user.password_hash) {
        // No tiene contraseña, es primer ingreso
        setStep(3);
      } else {
        // Ya tiene contraseña, pedir login
        setStep(2);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      const hashed = await hashPassword(password);
      if (hashed === userData.password_hash) {
        toast.success("¡Bienvenido!");
        login(userData);
      } else {
        toast.error("Contraseña incorrecta.");
      }
    } catch (err) {
      toast.error("Error al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  const validatePasswordComplexity = (pass) => {
    // min 6 caracteres, 1 letra, 1 numero
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return regex.test(pass);
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (!validatePasswordComplexity(password)) {
      toast.error("La contraseña debe tener al menos 6 caracteres, incluir 1 letra y 1 número.");
      return;
    }

    setIsLoading(true);
    try {
      const hashed = await hashPassword(password);
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
      
      // En SheetDB, actualizamos buscando por id_documento
      const res = await fetch(`${sheetUrl}/id_documento/${userData.id_documento}?sheet=users`, {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: {
            password_hash: hashed,
            primer_ingreso: "false"
          }
        })
      });

      if (!res.ok) throw new Error("Fallo la comunicación con la base de datos.");

      toast.success("Contraseña creada exitosamente. ¡Bienvenido!");
      // Actualizar el estado local antes de login
      const updatedUser = { ...userData, password_hash: hashed, primer_ingreso: "false" };
      login(updatedUser);
    } catch (err) {
      toast.error("Error al crear la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100 dark:border-slate-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Acceso Staff</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Portal exclusivo para administrativos y docentes.
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleDocumentSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                Documento de Identidad
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
                placeholder="Ej. 1020304050"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 bg-Sam hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors w-full disabled:opacity-70"
            >
              {isLoading ? "Consultando..." : "Siguiente"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              Hola, <span className="font-bold">{userData?.nombre}</span>. Ingresa tu contraseña.
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
                placeholder="********"
                required
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setStep(1); setPassword(""); }}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors w-1/3"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-Sam hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors w-2/3 disabled:opacity-70"
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCreatePassword} className="flex flex-col gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-3 rounded-lg text-sm mb-2 border border-blue-100 dark:border-blue-800">
              <span className="font-bold">¡Bienvenido/a {userData?.nombre}!</span><br/>
              Como es tu primer ingreso, debes crear una contraseña para tu cuenta.
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
                placeholder="Mínimo 6 caracteres (letras y números)"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 w-full rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-Sam outline-none"
                placeholder="Repite la contraseña"
                required
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setStep(1); setPassword(""); setConfirmPassword(""); }}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors w-1/3"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-Sam hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors w-2/3 disabled:opacity-70"
              >
                {isLoading ? "Guardando..." : "Crear Contraseña"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
