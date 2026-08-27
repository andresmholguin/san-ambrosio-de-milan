import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function EditStudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`${sheetUrl}/search?student_doc=${id}`);
        if (!res.ok) throw new Error("Error fetching student");
        const data = await res.json();
        
        if (data && data.length > 0) {
          const student = data[0];
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
              grado: student.student_grade
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
        toast.error("Error al cargar datos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudent();
  }, [id, sheetUrl, reset, navigate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Reconstruir direcciones
      const formatAddress = (dir, bar) => (dir || "").trim() + (bar ? " - " + bar.trim() : "");

      const payload = {
        data: [
          {
            student_doc_type: data.student.tipoDocumento || "Tarjeta de Identidad",
            student_name: (data.student.nombres || "").toUpperCase().trim(),
            student_lastname: (data.student.apellidos || "").toUpperCase().trim(),
            student_birth: data.student.fechaNacimiento,
            student_address: formatAddress(data.student.direccion, data.student.barrio).toUpperCase(),
            student_grade: (data.student.grado || "").toUpperCase().trim(),
            
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
          }
        ]
      };

      const res = await fetch(`${sheetUrl}/student_doc/${id}`, {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error al actualizar");
      
      toast.success("Datos actualizados correctamente");
      navigate(`/admin/estudiante/${id}`);
    } catch (error) {
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Cargando formulario...</div>;
  }

  return (
    <div className="p-6 md:p-12 w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Editar Datos del Estudiante</h1>
        <Link to={`/admin/estudiante/${id}`} className="text-slate-500 hover:text-slate-700 font-semibold px-4 py-2 border rounded-lg">Cancelar</Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        
        {/* Estudiante */}
        <section>
          <h2 className="text-xl font-bold text-Sam border-b pb-2 mb-4">1. Estudiante</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-semibold">Nombres</label><input {...register("student.nombres", { required: true })} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Apellidos</label><input {...register("student.apellidos", { required: true })} className="w-full p-2 border rounded" /></div>
            <div>
              <label className="text-sm font-semibold">Tipo de Documento</label>
              <select {...register("student.tipoDocumento")} className="w-full p-2 border rounded">
                <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                <option value="Registro Civil">Registro Civil</option>
                <option value="Cédula de Extranjería">Cédula de Extranjería</option>
              </select>
            </div>
            <div><label className="text-sm font-semibold">Fecha de Nacimiento</label><input type="date" {...register("student.fechaNacimiento")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Grado</label><input {...register("student.grado")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Dirección</label><input {...register("student.direccion")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Barrio</label><input {...register("student.barrio")} className="w-full p-2 border rounded" /></div>
          </div>
        </section>

        {/* Madre */}
        <section>
          <h2 className="text-xl font-bold text-Sam border-b pb-2 mb-4">2. Madre</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-semibold">Nombres</label><input {...register("mother.nombres")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Apellidos</label><input {...register("mother.apellidos")} className="w-full p-2 border rounded" /></div>
            <div>
              <label className="text-sm font-semibold">Tipo de Documento</label>
              <select {...register("mother.tipoDocumento")} className="w-full p-2 border rounded">
                <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div><label className="text-sm font-semibold">Documento</label><input {...register("mother.documento")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Teléfono</label><input {...register("mother.telefono")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Email</label><input type="email" {...register("mother.email")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Dirección</label><input {...register("mother.direccion")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Barrio</label><input {...register("mother.barrio")} className="w-full p-2 border rounded" /></div>
          </div>
        </section>

        {/* Padre */}
        <section>
          <h2 className="text-xl font-bold text-Sam border-b pb-2 mb-4">3. Padre</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-semibold">Nombres</label><input {...register("father.nombres")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Apellidos</label><input {...register("father.apellidos")} className="w-full p-2 border rounded" /></div>
            <div>
              <label className="text-sm font-semibold">Tipo de Documento</label>
              <select {...register("father.tipoDocumento")} className="w-full p-2 border rounded">
                <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div><label className="text-sm font-semibold">Documento</label><input {...register("father.documento")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Teléfono</label><input {...register("father.telefono")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Email</label><input type="email" {...register("father.email")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Dirección</label><input {...register("father.direccion")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Barrio</label><input {...register("father.barrio")} className="w-full p-2 border rounded" /></div>
          </div>
        </section>

        {/* Acudiente */}
        <section>
          <h2 className="text-xl font-bold text-Sam border-b pb-2 mb-4">4. Acudiente Principal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-semibold">Nombres</label><input {...register("attendant.nombres", { required: true })} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Apellidos</label><input {...register("attendant.apellidos", { required: true })} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Parentesco</label><input {...register("attendant.parentesco", { required: true })} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Teléfono</label><input {...register("attendant.telefono", { required: true })} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Email</label><input type="email" {...register("attendant.email")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Dirección</label><input {...register("attendant.direccion")} className="w-full p-2 border rounded" /></div>
            <div><label className="text-sm font-semibold">Barrio</label><input {...register("attendant.barrio")} className="w-full p-2 border rounded" /></div>
          </div>
        </section>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-Sam hover:bg-green-700 text-white font-bold py-4 rounded-xl disabled:opacity-50"
        >
          {isSubmitting ? "Guardando Cambios..." : "Guardar Cambios del Estudiante"}
        </button>
      </form>
    </div>
  );
}
