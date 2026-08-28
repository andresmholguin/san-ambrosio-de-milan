import { 
  collection,
  doc, 
  getDoc, 
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";

const SCHEMAS_COLLECTION = "form_schemas";

/**
 * Obtiene TODOS los formularios creados.
 */
export async function getAllForms() {
  const collRef = collection(db, SCHEMAS_COLLECTION);
  const snap = await getDocs(collRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Obtiene el esquema completo de un formulario específico.
 */
export async function getFormSchema(formId) {
  const docRef = doc(db, SCHEMAS_COLLECTION, formId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

export async function getFormSchemaByPath(path) {
  const forms = await getAllForms();
  return forms.find(f => {
    const formPath = f.path || `/${f.id}`;
    return formPath === path;
  }) || null;
}

/**
 * Guarda o actualiza un formulario completo (Metadata + Fields).
 */
export async function saveFormFullSchema(formId, formObject) {
  const docRef = doc(db, SCHEMAS_COLLECTION, formId);
  await setDoc(docRef, { ...formObject, updatedAt: new Date().toISOString() });
}

export async function deleteFormSchema(formId) {
  const docRef = doc(db, SCHEMAS_COLLECTION, formId);
  await deleteDoc(docRef);
}

/**
 * Semilla inicial actualizada para soportar metadata y layout (columnas).
 */
export async function seedInitialSchemas() {
  const teacherRef = doc(db, SCHEMAS_COLLECTION, "teacher_form");
  const teacherSnap = await getDoc(teacherRef);

  // Restauramos la condición de seguridad
  if (!teacherSnap.exists() || !teacherSnap.data().sections) {
    const teacherSchema = {
      title: "Registro de Docentes",
      description: "Por favor, completa el siguiente formulario con tus datos personales y profesionales. Esta información es estrictamente confidencial.",
      submitText: "Enviar Formulario",
      sections: [
        {
          id: "sec_personal",
          title: "1. Información Personal",
          elements: [
            { id: "id_documento", type: "field", inputType: "number", label: "Documento de Identidad (C.C)", required: true, visible: true, width: "1/2" },
            { id: "nombre", type: "field", inputType: "text", label: "Nombres", required: true, visible: true, width: "1/2" },
            { id: "apellidos", type: "field", inputType: "text", label: "Apellidos", required: true, visible: true, width: "1/2" },
            { id: "fecha_nacimiento", type: "field", inputType: "date", label: "Fecha de Nacimiento", required: true, visible: true, width: "1/2" },
            { id: "email", type: "field", inputType: "email", label: "Correo Electrónico", required: true, visible: true, width: "1/2" },
            { id: "telefono", type: "field", inputType: "tel", label: "Teléfono Celular", required: true, visible: true, width: "1/2" },
            { id: "direccion", type: "field", inputType: "text", label: "Dirección de Residencia y Barrio", required: true, visible: true, width: "full" },
          ]
        },
        {
          id: "sec_profesional",
          title: "2. Información Profesional",
          elements: [
            { id: "titulo_profesional", type: "field", inputType: "text", label: "Título Universitario / Especialidad", required: true, visible: true, placeholder: "Ej. Licenciatura en Pedagogía Infantil", width: "full" },
            { id: "experiencia", type: "field", inputType: "number", label: "Años de Experiencia", required: true, visible: true, width: "1/2" },
            { id: "fondo_pension", type: "field", inputType: "text", label: "Fondo de Pensión", required: true, visible: true, width: "1/2" },
            { id: "fondo_cesantias", type: "field", inputType: "text", label: "Fondo de Cesantías", required: true, visible: true, width: "1/2" },
          ]
        },
        {
          id: "sec_salud",
          title: "3. Información Médica y Emergencias",
          elements: [
            { id: "eps", type: "field", inputType: "text", label: "EPS", required: true, visible: true, width: "1/3" },
            { id: "tipo_sangre", type: "field", inputType: "text", label: "Tipo de Sangre (RH)", required: true, visible: true, placeholder: "Ej. O+", width: "1/3" },
            { id: "talla_camisa", type: "field", inputType: "select", label: "Talla de Camisa (Uniformes)", required: true, visible: true, options: "XS,S,M,L,XL,XXL", width: "1/3" },
            { type: "divider" },
            { id: "alergias", type: "field", inputType: "textarea", label: "Alergias o Enfermedades (Opcional)", required: false, visible: true, width: "full" },
            { type: "divider" },
            { id: "contacto_emergencia", type: "field", inputType: "text", label: "Contacto de Emergencia", required: true, visible: true, placeholder: "Nombre completo", width: "1/3" },
            { id: "telefono_emergencia", type: "field", inputType: "tel", label: "Teléfono de Emergencia", required: true, visible: true, width: "1/3" },
          ]
        }
      ]
    };
    await setDoc(teacherRef, { ...teacherSchema, updatedAt: new Date().toISOString() });
  }

  // Seed for Student Form
  const studentRef = doc(db, SCHEMAS_COLLECTION, "student_form");
  const studentSnap = await getDoc(studentRef);

  if (true) { // Force update temporarily
    const studentSchema = {
      title: "Actualización de Datos Estudiantiles",
      description: "Por favor, completa la siguiente información con datos reales y actualizados.",
      submitText: "Guardar Estudiante",
      layoutStyle: "multi_step", // 'single_page' o 'multi_step'
      sections: [
        {
          id: "sec_estudiante",
          title: "Datos del Estudiante",
          elements: [
            { id: "estudiante_documento", type: "field", inputType: "number", label: "Número de Documento", required: true, visible: true, width: "1/2" },
            { id: "estudiante_tipo_doc", type: "field", inputType: "select", label: "Tipo de Documento", required: true, visible: true, options: "Tarjeta de Identidad,Registro Civil,Cédula de Extranjería", width: "1/2" },
            { id: "estudiante_nombres", type: "field", inputType: "text", label: "Nombres", required: true, visible: true, width: "1/2" },
            { id: "estudiante_apellidos", type: "field", inputType: "text", label: "Apellidos", required: true, visible: true, width: "1/2" },
            { id: "estudiante_nacimiento", type: "field", inputType: "date", label: "Fecha de Nacimiento", required: true, visible: true, width: "1/2" },
            { id: "estudiante_grado", type: "field", inputType: "select", label: "Grado a Cursar", required: true, visible: true, options: "Párvulos,Pre-Jardín,Jardín,Transición,Primero,Segundo,Tercero,Cuarto,Quinto", width: "1/2" },
            { id: "estudiante_direccion", type: "field", inputType: "text", label: "Dirección de Residencia", required: true, visible: true, width: "1/2" },
            { id: "estudiante_barrio", type: "field", inputType: "text", label: "Barrio", required: true, visible: true, width: "1/2" },
          ]
        },
        {
          id: "sec_padre",
          title: "Datos del Padre",
          elements: [
            { id: "padre_documento", type: "field", inputType: "number", label: "Documento del Padre", required: false, visible: true, width: "1/2" },
            { id: "padre_nombre", type: "field", inputType: "text", label: "Nombres y Apellidos", required: false, visible: true, width: "1/2" },
            { id: "padre_ocupacion", type: "field", inputType: "text", label: "Ocupación", required: false, visible: true, width: "1/2" },
            { id: "padre_celular", type: "field", inputType: "tel", label: "Celular", required: false, visible: true, width: "1/2" },
            { id: "padre_email", type: "field", inputType: "email", label: "Correo Electrónico", required: false, visible: true, width: "full" },
            { id: "padre_misma_direccion", type: "field", inputType: "checkbox", label: "¿Vive con el estudiante? (Misma dirección)", required: false, visible: true, width: "full", checkboxColor: "#0e704d" },
            { id: "padre_direccion", type: "field", inputType: "text", label: "Dirección de Residencia", required: false, visible: true, width: "1/2" },
            { id: "padre_barrio", type: "field", inputType: "text", label: "Barrio", required: false, visible: true, width: "1/2" },
          ]
        },
        {
          id: "sec_madre",
          title: "Datos de la Madre",
          elements: [
            { id: "madre_documento", type: "field", inputType: "number", label: "Documento de la Madre", required: false, visible: true, width: "1/2" },
            { id: "madre_nombre", type: "field", inputType: "text", label: "Nombres y Apellidos", required: false, visible: true, width: "1/2" },
            { id: "madre_ocupacion", type: "field", inputType: "text", label: "Ocupación", required: false, visible: true, width: "1/2" },
            { id: "madre_celular", type: "field", inputType: "tel", label: "Celular", required: false, visible: true, width: "1/2" },
            { id: "madre_email", type: "field", inputType: "email", label: "Correo Electrónico", required: false, visible: true, width: "full" },
            { id: "madre_misma_direccion", type: "field", inputType: "checkbox", label: "¿Vive con el estudiante? (Misma dirección)", required: false, visible: true, width: "full", checkboxColor: "#0e704d" },
            { id: "madre_direccion", type: "field", inputType: "text", label: "Dirección de Residencia", required: false, visible: true, width: "1/2" },
            { id: "madre_barrio", type: "field", inputType: "text", label: "Barrio", required: false, visible: true, width: "1/2" },
          ]
        },
        {
          id: "sec_acudiente",
          title: "Datos del Acudiente Principal",
          elements: [
            { id: "acudiente_parentesco", type: "field", inputType: "custom_parentesco", label: "Parentesco con el estudiante", required: true, visible: true, width: "full" },
            { id: "acudiente_nombre", type: "field", inputType: "text", label: "Nombres y Apellidos", required: true, visible: true, width: "1/2" },
            { id: "acudiente_documento", type: "field", inputType: "number", label: "Número de Documento", required: true, visible: true, width: "1/2" },
            { id: "acudiente_celular", type: "field", inputType: "tel", label: "Teléfono Celular", required: true, visible: true, width: "1/2" },
            { id: "acudiente_email", type: "field", inputType: "email", label: "Correo Electrónico", required: true, visible: true, width: "1/2" },
          ]
        }
      ]
    };
    await setDoc(studentRef, { ...studentSchema, updatedAt: new Date().toISOString() });
  }
}
