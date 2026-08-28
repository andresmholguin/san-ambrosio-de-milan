import { useState, useEffect } from "react";
import { getAllForms, getFormSchema, saveFormFullSchema, deleteFormSchema } from "../../../services/formSchemaService";
import { useAuthStore } from "../../../store/useAuthStore";
import toast from "react-hot-toast";

export function SettingsFormBuilder() {
  const { user } = useAuthStore();
  const [view, setView] = useState("list"); // "list" | "edit"
  
  // List State
  const [formsList, setFormsList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Editor State
  const [currentFormId, setCurrentFormId] = useState("");
  const [isNewForm, setIsNewForm] = useState(false);
  const [formMeta, setFormMeta] = useState({ title: "", description: "", submitText: "Enviar" });
  const [sections, setSections] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Modal / Inline Edit States
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [editingElementIndex, setEditingElementIndex] = useState(null); // { secIdx, elIdx }
  const [editData, setEditData] = useState(null); // Data for section or element being edited

  // Menus State
  const [activeAddMenu, setActiveAddMenu] = useState(null); // { type: 'form' | 'section', secIdx?: number }

  useEffect(() => {
    if (view === "list") fetchFormsList();
  }, [view]);

  const fetchFormsList = async () => {
    setIsLoadingList(true);
    try {
      const data = await getAllForms();
      setFormsList(data);
    } catch (error) {
      toast.error("Error cargando formularios.");
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleCreateNew = () => {
    const newId = prompt("Ingresa el identificador único del formulario (ej. student_form, ex_alumnos, etc). Solo minúsculas y guiones bajos:");
    if (!newId || newId.trim() === "") return;
    if (formsList.some(f => f.id === newId)) return toast.error("Este identificador ya existe.");

    setCurrentFormId(newId.trim().toLowerCase());
    setFormMeta({ title: "Nuevo Formulario", description: "", submitText: "Enviar" });
    setSections([]);
    setIsNewForm(true);
    setView("edit");
  };

  const handleEditForm = async (id) => {
    setIsLoadingList(true);
    try {
      const schema = await getFormSchema(id);
      if (schema) {
        setCurrentFormId(schema.id);
        setFormMeta({
          title: schema.title || "",
          description: schema.description || "",
          submitText: schema.submitText || "Enviar",
          layoutStyle: schema.layoutStyle || "single_page",
          path: schema.path || `/${id}`,
          isActive: schema.isActive !== false // Default true
        });
        
        // Handle migration from flat fields to sections
        if (schema.fields && !schema.sections) {
           setSections([{ id: "sec_migrated", title: "Sección General", elements: schema.fields.map(f => ({ ...f, type: "field", inputType: f.type })) }]);
        } else {
           setSections(schema.sections || []);
        }
        
        setIsNewForm(false);
        setView("edit");
      }
    } catch (error) {
      toast.error("Error cargando el esquema");
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleDeleteForm = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar completamente el formulario '${id}'? Esto no se puede deshacer.`)) {
      try {
        await deleteFormSchema(id);
        toast.success("Formulario eliminado.");
        fetchFormsList();
      } catch (err) {
        toast.error("Error al eliminar.");
      }
    }
  };

  const handleSaveForm = async () => {
    if (!formMeta.title.trim()) return toast.error("El formulario debe tener un título.");
    setIsSaving(true);
    try {
      const payload = {
        title: formMeta.title,
        description: formMeta.description,
        submitText: formMeta.submitText,
        layoutStyle: formMeta.layoutStyle || "single_page",
        path: formMeta.path,
        isActive: formMeta.isActive,
        sections: sections
      };
      await saveFormFullSchema(currentFormId, payload);
      toast.success("Formulario guardado exitosamente.");
      setView("list");
    } catch (error) {
      toast.error("Error guardando el formulario.");
    } finally {
      setIsSaving(false);
    }
  };

  // ---- ELEMENT MANAGEMENT ----
  const handleAddSection = () => {
    const newSection = { id: `sec_${Date.now()}`, title: "Nueva Sección", elements: [] };
    setSections([...sections, newSection]);
    setEditingSectionIndex(sections.length);
    setEditData(newSection);
    setActiveAddMenu(null);
  };

  const handleAddElement = (secIdx, type) => {
    let newElement = { type };
    if (type === "field") {
      newElement = { id: `campo_${Date.now()}`, type: "field", inputType: "text", label: "Nuevo Campo", required: false, visible: true, width: "full", options: "" };
    } else if (type === "alert") {
      newElement = { id: `alert_${Date.now()}`, type: "alert", text: "Mensaje informativo importante...", alertColor: "#3b82f6", icon: "info", visible: true, width: "full" };
    } else if (type === "button") {
      newElement = { id: `btn_${Date.now()}`, type: "button", label: "Botón", actionUrl: "", buttonType: "link" };
    } else if (type === "divider") {
      newElement = { id: `div_${Date.now()}`, type: "divider" };
    }
    
    const updated = [...sections];
    updated[secIdx].elements.push(newElement);
    setSections(updated);
    
    if (type !== "divider") {
      setEditingElementIndex({ secIdx, elIdx: updated[secIdx].elements.length - 1 });
      setEditData(newElement);
    }
    setActiveAddMenu(null);
  };

  const saveEdit = () => {
    const updated = [...sections];
    if (editingSectionIndex !== null) {
      updated[editingSectionIndex] = editData;
    } else if (editingElementIndex) {
      const { secIdx, elIdx } = editingElementIndex;
      updated[secIdx].elements[elIdx] = editData;
    }
    setSections(updated);
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingSectionIndex(null);
    setEditingElementIndex(null);
    setEditData(null);
    setActiveAddMenu(null);
  };

  const moveElement = (secIdx, elIdx, dir) => {
    const updated = [...sections];
    const elements = updated[secIdx].elements;
    if (dir === -1 && elIdx > 0) {
      const temp = elements[elIdx - 1];
      elements[elIdx - 1] = elements[elIdx];
      elements[elIdx] = temp;
    } else if (dir === 1 && elIdx < elements.length - 1) {
      const temp = elements[elIdx + 1];
      elements[elIdx + 1] = elements[elIdx];
      elements[elIdx] = temp;
    }
    setSections(updated);
  };

  const moveSection = (secIdx, dir) => {
    const updated = [...sections];
    if (dir === -1 && secIdx > 0) {
      const temp = updated[secIdx - 1];
      updated[secIdx - 1] = updated[secIdx];
      updated[secIdx] = temp;
    } else if (dir === 1 && secIdx < updated.length - 1) {
      const temp = updated[secIdx + 1];
      updated[secIdx + 1] = updated[secIdx];
      updated[secIdx] = temp;
    }
    setSections(updated);
  };

  const deleteSection = (secIdx) => {
    if (window.confirm("¿Eliminar toda la sección y sus elementos?")) {
      const updated = [...sections];
      updated.splice(secIdx, 1);
      setSections(updated);
    }
  };

  const deleteElement = (secIdx, elIdx) => {
    if (window.confirm("¿Eliminar este elemento?")) {
      const updated = [...sections];
      updated[secIdx].elements.splice(elIdx, 1);
      setSections(updated);
    }
  };

  const handleToggleActive = async (formObj) => {
    const isActivating = formObj.isActive === false;
    if (!window.confirm(`¿Estás seguro de que deseas ${isActivating ? 'ACTIVAR' : 'DESACTIVAR'} este formulario?\n\n${!isActivating ? 'El público ya no podrá acceder a este formulario.' : 'El formulario volverá a estar disponible para el público.'}`)) {
      return;
    }
    
    try {
      const updatedForm = { ...formObj, isActive: isActivating };
      await saveFormFullSchema(formObj.id, updatedForm);
      setFormsList(formsList.map(f => f.id === formObj.id ? updatedForm : f));
      toast.success(updatedForm.isActive ? "Formulario Activado" : "Formulario Desactivado");
    } catch (e) {
      toast.error("Error al cambiar estado");
    }
  };

  if (user?.rol !== "superadmin") return null;

  return (
    <div className="flex flex-col gap-6">
      {view === "list" ? (
        // ================= VISTA: LISTA DE FORMULARIOS =================
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">⚙️ Gestión de Formularios Dinámicos</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Estructura jerárquica con Secciones.</p>
            </div>
            <button onClick={handleCreateNew} className="bg-Sam hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Crear Nuevo
            </button>
          </div>
          {isLoadingList ? (
            <p className="text-slate-500 text-center py-8">Cargando formularios...</p>
          ) : formsList.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No hay formularios creados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formsList.map(f => (
                <div key={f.id} className={`border-2 rounded-2xl p-5 transition-colors ${f.isActive !== false ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50' : 'border-red-200 bg-red-50/30'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate">{f.title || f.id}</h3>
                    <button 
                      onClick={() => handleToggleActive(f)}
                      className={`text-[10px] px-2 py-1 rounded-full font-bold transition-colors ${f.isActive !== false ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'}`}
                      title={f.isActive !== false ? "Desactivar" : "Activar"}
                    >
                      {f.isActive !== false ? "ACTIVO" : "INACTIVO"}
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-1 mb-4">
                    <span className="text-[11px] text-blue-600 font-mono truncate bg-blue-50 px-2 py-0.5 rounded w-fit">Ruta: {f.path || `/${f.id}`}</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 font-mono w-fit truncate">ID: {f.id}</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleEditForm(f.id)} className="flex-1 bg-white border border-gray-300 hover:border-Sam py-2 rounded-lg font-bold text-xs shadow-sm">✏️ Editar</button>
                    {f.id !== "teacher_form" && f.id !== "student_form" && (
                      <button onClick={() => handleDeleteForm(f.id)} className="px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg shadow-sm">🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ================= VISTA: EDITOR DE FORMULARIO =================
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 pb-20">
          <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
            <div>
              <button onClick={() => setView("list")} className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center gap-1 mb-2">← Volver</button>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{isNewForm ? "Creando:" : "Editando:"} <code className="text-Sam bg-Sam/10 px-2 py-1 rounded-lg">{currentFormId}</code></h2>
            </div>
            <button onClick={handleSaveForm} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-md">
              {isSaving ? "Guardando..." : "💾 Guardar"}
            </button>
          </div>

          {/* 1. METADATA GLOBAL */}
          <div className="mb-10 bg-gray-50 dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg border-b pb-2">1. Encabezado Global</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Título Público</label>
                <input type="text" value={formMeta.title} onChange={e => setFormMeta({...formMeta, title: e.target.value})} className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Modo de Visualización</label>
                <select value={formMeta.layoutStyle || "single_page"} onChange={e => setFormMeta({...formMeta, layoutStyle: e.target.value})} className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800 font-semibold text-sm">
                  <option value="single_page">Página Única (Hacia abajo)</option>
                  <option value="multi_step">Multi-Paso (Asistente Siguiente/Atrás)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Botón Final</label>
                <input type="text" value={formMeta.submitText} onChange={e => setFormMeta({...formMeta, submitText: e.target.value})} className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ruta Pública (URL Path)</label>
                <input type="text" value={formMeta.path || ""} onChange={e => setFormMeta({...formMeta, path: e.target.value})} placeholder="Ej. /estudiantes, /encuesta" className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Estado del Formulario</label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isActiveForm" checked={formMeta.isActive} onChange={e => setFormMeta({...formMeta, isActive: e.target.checked})} className="w-5 h-5 cursor-pointer accent-Sam" />
                  <label htmlFor="isActiveForm" className="cursor-pointer font-bold text-sm">{formMeta.isActive ? 'Activo (Público)' : 'Inactivo (Cerrado)'}</label>
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Instrucciones</label>
                <textarea value={formMeta.description} onChange={e => setFormMeta({...formMeta, description: e.target.value})} className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800" rows="2" />
              </div>
            </div>
          </div>

          {/* 2. ESTRUCTURA DE SECCIONES */}
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">2. Estructura Jerárquica</h3>
            
            {sections.map((sec, secIdx) => (
              <div key={secIdx} className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border-2 border-gray-200 dark:border-slate-700 relative">
                {editingSectionIndex === secIdx ? (
                  // Edit Section Form
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-200 mb-4">
                    <h4 className="font-bold text-blue-600 mb-2">Editando Sección</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <label className="font-bold block mb-1 text-xs">Título de la Sección</label>
                        <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="w-full p-2 border rounded" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded font-bold">Cancelar</button>
                        <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Guardar Sección</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Section Header
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="bg-Sam text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{secIdx + 1}</span>
                      {sec.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveSection(secIdx, -1)} className="p-1 hover:bg-gray-200 rounded">↑</button>
                      <button onClick={() => moveSection(secIdx, 1)} className="p-1 hover:bg-gray-200 rounded">↓</button>
                      <button onClick={() => { setEditingSectionIndex(secIdx); setEditData(sec); }} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded font-bold ml-2">Editar</button>
                      <button onClick={() => deleteSection(secIdx)} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded font-bold">Borrar</button>
                    </div>
                  </div>
                )}

                {/* Elements List */}
                <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-slate-700 ml-3">
                  {sec.elements.map((el, elIdx) => (
                    <div key={elIdx} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative group">
                      
                      {editingElementIndex?.secIdx === secIdx && editingElementIndex?.elIdx === elIdx ? (
                        // Edit Element Form
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 -m-3 rounded-xl border border-blue-200">
                          <h5 className="font-bold text-blue-600 mb-4">Editando {el.type === 'field' ? 'Campo' : 'Botón'}</h5>
                          
                          {el.type === "field" && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <label className="font-bold block mb-1">ID DB</label>
                                <input type="text" value={editData.id} onChange={e => setEditData({...editData, id: e.target.value})} className="w-full p-2 border rounded" disabled={!editData.id.startsWith("campo_")} />
                              </div>
                              <div>
                                <label className="font-bold block mb-1">Etiqueta Visual</label>
                                <input type="text" value={editData.label} onChange={e => setEditData({...editData, label: e.target.value})} className="w-full p-2 border rounded" />
                              </div>
                              <div>
                                <label className="font-bold block mb-1">Ancho</label>
                                <select value={editData.width} onChange={e => setEditData({...editData, width: e.target.value})} className="w-full p-2 border rounded font-semibold">
                                  <option value="full">100% (Full)</option>
                                  <option value="1/2">50% (1/2)</option>
                                  <option value="1/3">33% (1/3)</option>
                                  <option value="2/3">66% (2/3)</option>
                                </select>
                              </div>
                              <div>
                                <label className="font-bold block mb-1">Tipo de Input</label>
                                <select value={editData.inputType} onChange={e => setEditData({...editData, inputType: e.target.value})} className="w-full p-2 border rounded">
                                  <option value="text">Texto Corto</option>
                                  <option value="number">Número</option>
                                  <option value="email">Correo Electrónico</option>
                                  <option value="tel">Teléfono</option>
                                  <option value="date">Fecha</option>
                                  <option value="select">Lista (Select)</option>
                                  <option value="textarea">Área de Texto</option>
                                  <option value="checkbox">Casilla Verificación</option>
                                  <option value="file">Subir Archivo / Foto</option>
                                </select>
                              </div>
                              {editData.inputType === "select" && (
                                <div className="md:col-span-4">
                                  <label className="font-bold block mb-1">Opciones (,)</label>
                                  <input type="text" value={editData.options || ""} onChange={e => setEditData({...editData, options: e.target.value})} className="w-full p-2 border rounded" placeholder="Opcion 1, Opcion 2" />
                                </div>
                              )}
                              
                              <div className="md:col-span-4">
                                <label className="font-bold block mb-1">Texto de Ayuda / Descripción Secundaria</label>
                                <input type="text" value={editData.helpText || ""} onChange={e => setEditData({...editData, helpText: e.target.value})} className="w-full p-2 border rounded" placeholder="Ej. Recibirás un correo cuando..." />
                              </div>

                              {editData.inputType === "checkbox" && (
                                <div className="md:col-span-4">
                                  <label className="font-bold block mb-1">Color del Checkbox (Fondo y Check)</label>
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="color" 
                                      value={editData.checkboxColor || "#0e704d"} 
                                      onChange={e => setEditData({...editData, checkboxColor: e.target.value})} 
                                      className="w-12 h-10 p-1 border rounded cursor-pointer" 
                                    />
                                    <span className="text-xs text-slate-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                      {editData.checkboxColor || "#0e704d"}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="md:col-span-4 flex justify-between mt-2">
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-1 font-bold"><input type="checkbox" checked={editData.required} onChange={e => setEditData({...editData, required: e.target.checked})} /> Obligatorio</label>
                                  <label className="flex items-center gap-1 font-bold"><input type="checkbox" checked={editData.visible} onChange={e => setEditData({...editData, visible: e.target.checked})} /> Visible</label>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded font-bold">Cancelar</button>
                                  <button onClick={saveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Guardar Campo</button>
                                </div>
                              </div>
                            </div>
                          )}

                          {el.type === "alert" && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                              <div className="md:col-span-4">
                                <label className="font-bold block mb-1">Texto del Mensaje</label>
                                <textarea value={editData.text || ""} onChange={e => setEditData({...editData, text: e.target.value})} className="w-full p-2 border rounded" rows="3" />
                              </div>
                              <div className="md:col-span-2">
                                <label className="font-bold block mb-1">Color del Cuadro</label>
                                <div className="flex items-center gap-3">
                                  <input type="color" value={editData.alertColor || "#3b82f6"} onChange={e => setEditData({...editData, alertColor: e.target.value})} className="w-12 h-10 p-1 border rounded cursor-pointer" />
                                  <span className="text-xs text-slate-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                    {editData.alertColor || "#3b82f6"}
                                  </span>
                                </div>
                              </div>
                              <div className="md:col-span-2">
                                <label className="font-bold block mb-1">Icono</label>
                                <select value={editData.icon || "info"} onChange={e => setEditData({...editData, icon: e.target.value})} className="w-full p-2 border rounded font-semibold">
                                  <option value="info">Información ( i )</option>
                                  <option value="warning">Advertencia ( ! )</option>
                                  <option value="success">Éxito ( Check )</option>
                                  <option value="star">Estrella ( ★ )</option>
                                </select>
                              </div>
                              <div className="md:col-span-4 flex justify-between mt-2">
                                <label className="flex items-center gap-1 font-bold"><input type="checkbox" checked={editData.visible} onChange={e => setEditData({...editData, visible: e.target.checked})} /> Visible</label>
                                <div className="flex gap-2">
                                  <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded font-bold">Cancelar</button>
                                  <button onClick={saveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Guardar InfoBox</button>
                                </div>
                              </div>
                            </div>
                          )}

                          {el.type === "button" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <label className="font-bold block mb-1">Texto del Botón</label>
                                <input type="text" value={editData.label} onChange={e => setEditData({...editData, label: e.target.value})} className="w-full p-2 border rounded" />
                              </div>
                              <div>
                                <label className="font-bold block mb-1">Enlace / Acción (Opcional)</label>
                                <input type="text" value={editData.actionUrl || ""} onChange={e => setEditData({...editData, actionUrl: e.target.value})} className="w-full p-2 border rounded" placeholder="https://..." />
                              </div>
                              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded font-bold">Cancelar</button>
                                <button onClick={saveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Guardar Botón</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Render Element summary
                        <div className="flex justify-between items-center">
                          {el.type === "divider" ? (
                            <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-slate-600 my-2 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest relative">
                              <span className="bg-white dark:bg-slate-800 px-2 relative -top-2">Línea Divisoria</span>
                            </div>
                          ) : el.type === "button" ? (
                            <div className="flex-1 flex items-center gap-2">
                              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold">Boton Intermedio</span>
                              <span className="font-bold text-sm text-slate-700">{el.label}</span>
                              {el.actionUrl && <span className="text-blue-500 text-xs underline truncate max-w-[200px]">{el.actionUrl}</span>}
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{el.label}</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-mono text-gray-600">{el.inputType}</span>
                              <span className="border border-blue-200 bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Ancho: {el.width}</span>
                              {!el.visible && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Oculto</span>}
                            </div>
                          )}

                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 pl-2">
                            <button onClick={() => moveElement(secIdx, elIdx, -1)} className="p-1 hover:bg-gray-100 rounded text-slate-400">↑</button>
                            <button onClick={() => moveElement(secIdx, elIdx, 1)} className="p-1 hover:bg-gray-100 rounded text-slate-400">↓</button>
                            {el.type !== "divider" && <button onClick={() => { setEditingElementIndex({secIdx, elIdx}); setEditData(el); }} className="px-2 py-1 text-blue-600 text-xs font-bold hover:bg-blue-50 rounded">Editar</button>}
                            <button onClick={() => deleteElement(secIdx, elIdx)} className="px-2 py-1 text-red-600 text-xs font-bold hover:bg-red-50 rounded">Borrar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Element Menu */}
                  {activeAddMenu?.type === "section" && activeAddMenu?.secIdx === secIdx ? (
                    <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mt-4">
                      <button onClick={() => handleAddElement(secIdx, 'field')} className="bg-white px-3 py-1.5 rounded shadow-sm text-sm font-bold text-slate-700 hover:text-blue-600">+ Campo</button>
                      <button onClick={() => handleAddElement(secIdx, 'alert')} className="bg-white px-3 py-1.5 rounded shadow-sm text-sm font-bold text-slate-700 hover:text-blue-600">+ InfoBox</button>
                      <button onClick={() => handleAddElement(secIdx, 'divider')} className="bg-white px-3 py-1.5 rounded shadow-sm text-sm font-bold text-slate-700 hover:text-blue-600">+ Divisor</button>
                      <button onClick={() => handleAddElement(secIdx, 'button')} className="bg-white px-3 py-1.5 rounded shadow-sm text-sm font-bold text-slate-700 hover:text-blue-600">+ Botón</button>
                      <button onClick={cancelEdit} className="ml-auto px-3 py-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setActiveAddMenu({ type: "section", secIdx })} className="text-blue-600 font-bold text-sm flex items-center gap-1 mt-4 hover:underline">
                      + Agregar elemento a esta sección
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Section Menu */}
            <div className="mt-8 border-t-2 border-dashed border-gray-300 dark:border-slate-600 pt-6 text-center">
              <button onClick={handleAddSection} className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-3 rounded-full font-bold shadow-md hover:scale-105 transition-transform">
                + Crear Nueva Sección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
