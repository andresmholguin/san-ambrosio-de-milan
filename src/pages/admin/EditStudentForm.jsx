import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getStudentByDoc, updateStudent, deleteStudent } from "../../services/studentService";
import toast from "react-hot-toast";

export default function EditStudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentDocNum, setStudentDocNum] = useState("");

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const student = await getStudentByDoc(id);
        
        if (student) {
          setStudentDocNum(student.student_doc || id);
          const parseAddress = (addr) => {
            if (!addr) return { dir: "", bar: "" };
            const parts = addr.split(" - ");
            return { dir: parts[0] || "", bar: parts.slice(1).join(" - ") || "" };
          };

          const studentAddr = parseAddress(student.student_address);
          const motherAddr = parseAddress(student.mother_address);
          const fatherAddr = parseAddress(student.father_address);
          const attendantAddr = parseAddress(student.attendant_address);

          reset({
            student: {
              nombres: student.student_name,
              apellidos: student.student_lastname,
              tipoDocumento: student.student_doc_type || "Tarjeta de Identidad",
              fechaNacimiento: student.student_birth,
              direccion: studentAddr.dir,
              barrio: studentAddr.bar,
              gradoAspirado: student.grado_aspirado || student.student_grade || "",
              grado: student.student_grade_section && student.student_grade_section !== "Sin Asignar" && student.student_grade_section !== "SIN ASIGNAR" ? student.student_grade_section : "Sin Asignar"
            },
            mother: {
              nombres: student.mother_name,
              apellidos: student.mother_lastname,
              tipoDocumento: student.mother_doc_type || "Cédula de Ciudadanía",
              documento: student.mother_doc,
              telefono: student.mother_phone,
              email: student.mother_email,
              direccion: motherAddr.dir,
              barrio: motherAddr.bar
            },
            father: {
              nombres: student.father_name,
              apellidos: student.father_lastname,
              tipoDocumento: student.father_doc_type || "Cédula de Ciudadanía",
              documento: student.father_doc,
              telefono: student.father_phone,
              email: student.father_email,
              direccion: fatherAddr.dir,
              barrio: fatherAddr.bar
            },
            attendant: {
              nombres: student.attendant_name,
              apellidos: student.attendant_lastname,
              telefono: student.attendant_phone,
              email: student.attendant_email,
              parentesco: student.attendant_relation || student.attendant_type,
              direccion: attendantAddr.dir,
              barrio: attendantAddr.bar
            }
          });
        } else {
          toast.error("Estudiante no encontrado");
          navigate("/admin");
        }
      } catch (error) {
        console.error("Error al cargar estudiante:", error);
        toast.error("Error al cargar datos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudent();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formatAddress = (dir, bar) => (dir || "").trim() + (bar ? " - " + bar.trim() : "");

      const payload = {
        student_doc_type: data.student.tipoDocumento || "Tarjeta de Identidad",
        student_name: (data.student.nombres || "").toUpperCase().trim(),
        student_lastname: (data.student.apellidos || "").toUpperCase().trim(),
        student_birth: data.student.fechaNacimiento,
        student_address: formatAddress(data.student.direccion, data.student.barrio).toUpperCase(),
        grado_aspirado: (data.student.gradoAspirado || "").toUpperCase().trim(),
        student_grade: (data.student.grado || "Sin Asignar").toUpperCase().trim(),
        student_grade_section: (data.student.grado || "Sin Asignar").toUpperCase().trim(),
        
        mother_name: (data.mother.nombres || "").toUpperCase().trim(),
        mother_lastname: (data.mother.apellidos || "").toUpperCase().trim(),
        mother_doc_type: data.mother.tipoDocumento || "Cédula de Ciudadanía",
        mother_doc: data.mother.documento,
        mother_phone: data.mother.telefono,
        mother_email: data.mother.email,
        mother_address: formatAddress(data.mother.direccion, data.mother.barrio).toUpperCase(),

        father_name: (data.father.nombres || "").toUpperCase().trim(),
        father_lastname: (data.father.apellidos || "").toUpperCase().trim(),
        father_doc_type: data.father.tipoDocumento || "Cédula de Ciudadanía",
        father_doc: data.father.documento,
        father_phone: data.father.telefono,
        father_email: data.father.email,
        father_address: formatAddress(data.father.direccion, data.father.barrio).toUpperCase(),

        attendant_name: (data.attendant.nombres || "").toUpperCase().trim(),
        attendant_lastname: (data.attendant.apellidos || "").toUpperCase().trim(),
        attendant_phone: data.attendant.telefono,
        attendant_email: data.attendant.email,
        attendant_relation: (data.attendant.parentesco || "").toUpperCase().trim(),
        attendant_type: (data.attendant.parentesco || "").toUpperCase().trim(),
        attendant_address: formatAddress(data.attendant.direccion, data.attendant.barrio).toUpperCase(),
      };

      await updateStudent(id, payload);
      
      toast.success("Datos actualizados correctamente");
      navigate(`/admin/estudiante/${id}`);
    } catch (error) {
      console.error("Error al actualizar estudiante:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás completamente seguro de eliminar a este estudiante (${studentDocNum || id}) del sistema escolar? Esta acción es irreversible.`)) {
      return;
    }

    try {
      await deleteStudent(id);
      toast.success("Estudiante eliminado correctamente");
      navigate("/admin");
    } catch (err) {
      console.error("Error al eliminar estudiante:", err);
      toast.error("No se pudo eliminar el estudiante");
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Cargando formulario...</div>;
  }

  return (
    <div className="p-6 md:p-12 w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Botón superior Cancelar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Editar Datos del Estudiante</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Documento: {studentDocNum || id}</p>
        </div>
        <Link 
          to={`/admin/estudiante/${id}`} 
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm transition-colors cursor-pointer"
        >
          Cancelar / Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        
        {/* Estudiante */}
        <section>
          <h2 className="text-lg font-bold text-Sam dark:text-green-400 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
            1. Datos del Estudiante
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Nombres</label>
              <input {...register("student.nombres", { required: true })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Apellidos</label>
              <input {...register("student.apellidos", { required: true })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Tipo de Documento</label>
              <select {...register("student.tipoDocumento")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none">
                <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                <option value="Registro Civil">Registro Civil</option>
                <option value="Cédula de Extranjería">Cédula de Extranjería</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Fecha de Nacimiento</label>
              <input 
                type="date" 
                max={new Date().toISOString().split("T")[0]}
                {...register("student.fechaNacimiento")} 
                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" 
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Grado Aspirado (A Cursar)</label>
              <input {...register("student.gradoAspirado")} placeholder="Ej. PRIMERO, 2" className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Salón Asignado</label>
              <input {...register("student.grado")} placeholder="Ej. 2A, PRIMERO o Sin Asignar" className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Dirección</label>
              <input {...register("student.direccion")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Barrio</label>
              <input {...register("student.barrio")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" />
            </div>
          </div>
        </section>

        {/* Madre */}
        <section>
          <h2 className="text-lg font-bold text-Sam dark:text-green-400 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
            2. Datos de la Madre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Nombres</label><input {...register("mother.nombres")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Apellidos</label><input {...register("mother.apellidos")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Tipo de Documento</label>
              <select {...register("mother.tipoDocumento")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none">
                <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Documento</label><input {...register("mother.documento")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Teléfono</label><input {...register("mother.telefono")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Email</label><input type="email" {...register("mother.email")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
          </div>
        </section>

        {/* Padre */}
        <section>
          <h2 className="text-lg font-bold text-Sam dark:text-green-400 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
            3. Datos del Padre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Nombres</label><input {...register("father.nombres")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Apellidos</label><input {...register("father.apellidos")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Tipo de Documento</label>
              <select {...register("father.tipoDocumento")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none">
                <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Documento</label><input {...register("father.documento")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Teléfono</label><input {...register("father.telefono")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Email</label><input type="email" {...register("father.email")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
          </div>
        </section>

        {/* Acudiente */}
        <section>
          <h2 className="text-lg font-bold text-Sam dark:text-green-400 border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
            4. Acudiente Principal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Nombres *</label><input {...register("attendant.nombres", { required: true })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Apellidos *</label><input {...register("attendant.apellidos", { required: true })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Parentesco *</label><input {...register("attendant.parentesco", { required: true })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Teléfono *</label><input {...register("attendant.telefono", { required: true })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Email</label><input type="email" {...register("attendant.email")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
            <div><label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Dirección</label><input {...register("attendant.direccion")} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl outline-none" /></div>
          </div>
        </section>

        {/* BOTONES INFERIORES: Guardar, Cancelar y Eliminar */}
        <div className="pt-6 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-Sam hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl disabled:opacity-50 text-xs shadow-md transition-colors cursor-pointer w-full sm:w-auto"
            >
              {isSubmitting ? "Guardando Cambios..." : "Guardar Cambios del Estudiante"}
            </button>
            <Link 
              to={`/admin/estudiante/${id}`} 
              className="py-3 px-5 text-center bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
            >
              Cancelar
            </Link>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="text-red-600 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900/60 font-bold py-3 px-5 rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar Estudiante
          </button>
        </div>
      </form>
    </div>
  );
}
