import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateStudentReportPDF = (student, annotations) => {
  const doc = new jsPDF();

  // Título e Información General
  doc.setFontSize(18);
  doc.setTextColor(14, 112, 77); // Verde SAM
  doc.text("Colegio San Ambrosio de Milán", 14, 22);

  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text("Reporte del Observador Estudiantil", 14, 32);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 40);

  // Datos del Estudiante
  autoTable(doc, {
    startY: 45,
    head: [["Información del Estudiante", ""]],
    body: [
      ["Nombre", `${student?.student_name || ""} ${student?.student_lastname || ""}`],
      ["Documento", student?.student_doc || "N/A"],
      ["Grado", student?.student_grade || "N/A"],
      ["Acudiente", `${student?.attendant_name || ""} ${student?.attendant_lastname || ""} (${student?.attendant_phone || "N/A"})`]
    ],
    theme: "grid",
    headStyles: { fillColor: [14, 112, 77], textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    margin: { bottom: 10 }
  });

  // Anotaciones
  if (annotations && annotations.length > 0) {
    const tableData = annotations.map((ann) => [
      ann.fecha || "",
      ann.categoria || "",
      ann.descripcion || "",
      ann.profesor_nombre || ""
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Fecha", "Categoría", "Descripción / Observación", "Registrado por"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 40 }
      },
      styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    });
  } else {
    doc.setFontSize(10);
    doc.text("No hay anotaciones registradas para este estudiante.", 14, doc.lastAutoTable.finalY + 15);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado automáticamente por SAM Admin`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  // Guardar archivo
  const safeName = (student?.student_name || "Estudiante").replace(/\s+/g, "");
  const safeDoc = student?.student_doc || "000";
  doc.save(`Observador_${safeDoc}_${safeName}.pdf`);
};
