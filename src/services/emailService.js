/**
 * Servicio de Notificaciones por Correo Electrónico para Acudientes y Padres.
 * Permite notificar inasistencias y adjuntar el enlace de justificación seguro.
 */

/**
 * Envía la notificación de inasistencia por correo electrónico a los padres/acudientes.
 * Mientras se configura el dominio oficial, los correos se dirigen a andresmholguin@gmail.com
 * debido a las políticas de sandbox de Resend (onboarding@resend.dev).
 * 
 * @param {Object} data { studentName, studentDoc, grade, date, teacherName, parentEmail, token }
 */
export async function sendAbsenceNotificationEmail({
  studentName,
  studentDoc,
  grade,
  date,
  teacherName,
  parentEmail,
  token
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://sambrosio.vercel.app";
  const justificationUrl = `${origin}/justificar-inasistencia/${token}`;

  // Configuración de Resend
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
  const fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || "Colegio San Ambrosio <onboarding@resend.dev>";
  const devRecipient = import.meta.env.VITE_TEST_EMAIL_RECIPIENT || "andresmholguin@gmail.com";

  // Si el remitente usa el dominio de sandbox (onboarding@resend.dev), Resend exige enviar a la cuenta del propietario
  const isSandbox = fromEmail.includes("onboarding@resend.dev");
  const destinationEmail = isSandbox ? devRecipient : (parentEmail || devRecipient);

  const emailSubject = isSandbox
    ? `[Inasistencia] ${studentName} (${grade}) - Colegio San Ambrosio [Para: ${parentEmail || "Acudiente"}]`
    : `Notificación de Inasistencia - ${studentName} (${grade}) - Colegio San Ambrosio`;

  // Plantilla de correo en HTML
  const emailHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: #0e704d; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold;">Colegio San Ambrosio de Milán</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Control y Acompañamiento Escolar</p>
      </div>

      <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
        ${isSandbox ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 20px; border-radius: 6px; font-size: 13px; color: #92400e;">
            ℹ️ <strong>Modo Desarrollo / Sandbox:</strong> Este correo se redirigió a <strong>${destinationEmail}</strong> mientras se verifica el dominio del colegio. Correo registrado del acudiente: <strong>${parentEmail || "No registrado"}</strong>.
          </div>
        ` : ''}

        <h2 style="color: #0e704d; font-size: 18px; margin-top: 0;">Estimado(a) Padre / Madre / Acudiente,</h2>
        <p style="font-size: 15px;">
          Le informamos que el día <strong>${date}</strong> se registró una <strong>inasistencia</strong> para el estudiante:
        </p>

        <div style="background: #f8fafc; border-left: 4px solid #0e704d; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Estudiante:</strong> ${studentName}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Documento:</strong> ${studentDoc}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Grado / Salón:</strong> ${grade}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Registrado por:</strong> ${teacherName || "Docente / Director de Grupo"}</p>
          ${parentEmail ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Correo Acudiente:</strong> ${parentEmail}</p>` : ''}
        </div>

        <p style="font-size: 14px; color: #64748b;">
          Para nosotros es fundamental conocer el motivo de la ausencia de su hijo(a) y garantizar su continuidad académica.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${justificationUrl}" style="background: #0e704d; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(14, 112, 77, 0.2);">
            Responder / Justificar Inasistencia
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Si el botón no funciona, copie y pegue el siguiente enlace en su navegador móvil o de escritorio:<br>
          <a href="${justificationUrl}" style="color: #0e704d; word-break: break-all;">${justificationUrl}</a>
        </p>
      </div>

      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Colegio San Ambrosio de Milán &bull; Notificación Automática del Sistema Escolar
      </div>
    </div>
  `;

  console.log(`[Email Service] Enviando notificación a: ${destinationEmail} (Original acudiente: ${parentEmail}). Enlace: ${justificationUrl}`);

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [destinationEmail],
          subject: emailSubject,
          html: emailHtml
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        console.warn("[Resend Warning / Error]:", resData);
        return { success: false, error: resData.message };
      }

      console.log("[Resend Success]: Correo enviado con éxito a", destinationEmail, "ID:", resData.id);
      return { success: true, id: resData.id, sentTo: destinationEmail };
    } catch (err) {
      console.error("Error al enviar vía Resend API:", err);
      return { success: false, error: err.message };
    }
  }

  return { success: true, simulated: true, url: justificationUrl };
}
