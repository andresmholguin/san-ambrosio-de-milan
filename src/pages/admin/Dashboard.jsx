import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { StudentsList } from "./components/StudentsList";
import { ProfessorsList } from "./components/ProfessorsList";
import { AttendanceForm } from "./components/AttendanceForm";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("estudiantes");

  return (
    <div className="p-6 md:p-12 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Bienvenido, <span className="font-semibold">{user?.nombre}</span> ({user?.rol === "admin" ? "Administrador" : "Profesor"})
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab("estudiantes")}
          className={`px-4 py-2 font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "estudiantes" 
              ? "border-Sam text-Sam" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Estudiantes
        </button>
        <button
          onClick={() => setActiveTab("asistencia")}
          className={`px-4 py-2 font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "asistencia" 
              ? "border-Sam text-Sam" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Control de Asistencia
        </button>
        {user?.rol === "admin" && (
          <button
            onClick={() => setActiveTab("profesores")}
            className={`px-4 py-2 font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "profesores" 
                ? "border-Sam text-Sam" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Gestión Profesores
          </button>
        )}
      </div>

      <div>
        {activeTab === "estudiantes" && <StudentsList />}
        {activeTab === "asistencia" && <AttendanceForm />}
        {activeTab === "profesores" && user?.rol === "admin" && <ProfessorsList />}
      </div>
    </div>
  );
}
