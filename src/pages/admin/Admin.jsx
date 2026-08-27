import { useAuthStore } from "../../store/useAuthStore";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import StudentProfile from "./StudentProfile";
import EditStudentForm from "./EditStudentForm";

export default function Admin() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[calc(100vh-150px)]">
        <Login />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-150px)]">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/estudiante/:id" element={<StudentProfile />} />
        <Route path="/estudiante/:id/editar" element={<EditStudentForm />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
}
