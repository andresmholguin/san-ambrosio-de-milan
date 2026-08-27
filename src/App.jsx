import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import UpdateForm from "./pages/UpdateForm";
import Admin from "./pages/admin/Admin";

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
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
        <Route path="/" element={<UpdateForm />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>

      <Footer />
    </>
  );
}
