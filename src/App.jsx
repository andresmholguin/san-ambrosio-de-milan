import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import UpdateForm from "./pages/UpdateForm";
import Admin from "./pages/admin/Admin";
import JustifyAbsence from "./pages/JustifyAbsence";
import TeacherRegistration from "./pages/TeacherRegistration";
import { seedInitialSchemas } from "./services/formSchemaService";

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    // Inicializar la DB si está vacía
    seedInitialSchemas().catch(console.error);
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <>
      <Header theme={theme} setTheme={setTheme} />
      
      <Routes>
        {/* Formularios Públicos (Motor Dinámico) */}
        <Route path="/" element={<UpdateForm />} />
        <Route path="/:formPath" element={<UpdateForm />} />
        
        {/* Otras Rutas */}
        <Route path="/profesor" element={<TeacherRegistration />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/justificar-inasistencia/:token" element={<JustifyAbsence />} />
      </Routes>

      <Footer />
    </>
  );
}
