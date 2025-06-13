import sgMail from "@sendgrid/mail";
import { createError } from "../middleware/errorHandlers.js";

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else if (process.env.NODE_ENV === "production") {
  console.error("⚠️  SENDGRID_API_KEY is required in production");
}

// Base email sending function
const sendEmail = async (mailOptions) => {
  try {
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.SENDGRID_API_KEY
    ) {
      // Development mode without SendGrid - log to console
      console.log("📧 EMAIL (Development Mode)");
      console.log("To:", mailOptions.to);
      console.log("Subject:", mailOptions.subject);
      console.log("HTML Preview:", mailOptions.html.substring(0, 200) + "...");
      console.log("---");
      return { messageId: "dev-mode-" + Date.now() };
    }

    // Use SendGrid for sending
    const msg = {
      to: mailOptions.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || "noreply@ritmocaribe.com",
        name: process.env.SENDGRID_FROM_NAME || "RitmoCaribe",
      },
      subject: mailOptions.subject,
      html: mailOptions.html,
      // Optional: Add tracking
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      // Optional: Add categories for analytics
      categories: mailOptions.categories || ["ritmo-events"],
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${mailOptions.to}`);
    return response[0];
  } catch (error) {
    console.error("❌ Email sending error:", error);

    // Log specific SendGrid errors
    if (error.response) {
      console.error("SendGrid Error:", error.response.body);
    }

    // Don't throw in development to avoid breaking the app
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Email failed in development mode, continuing...");
      return { messageId: "dev-failed-" + Date.now() };
    }

    throw createError(500, "Errore nell'invio dell'email");
  }
};

// Email templates
const emailTemplates = {
  // Welcome email
  welcome: (user) => ({
    subject: "Benvenuto in RitmoCaribe! 🎵",
    categories: ["welcome", "onboarding"],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1>🎵 Benvenuto in RitmoCaribe!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Ciao ${user.name}!</h2>
          <p>Grazie per esserti unito alla nostra community di appassionati di danza caraibica!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🕺 Cosa puoi fare ora:</h3>
            <ul>
              <li>Esplora tutti gli eventi di salsa e bachata</li>
              <li>Salva i tuoi eventi preferiti</li>
              <li>Segui organizzatori e altri ballerini</li>
              <li>Commenta e valuta gli eventi</li>
              ${
                user.role === "organizer"
                  ? "<li>Crea e gestisci i tuoi eventi</li>"
                  : ""
              }
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/events" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Esplora Eventi
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Hai domande? Rispondi a questa email o contattaci su 
            <a href="mailto:info@ritmocaribe.com">info@ritmocaribe.com</a>
          </p>
        </div>
      </div>
    `,
  }),

  // Event approved
  eventApproved: (event, organizer) => ({
    subject: `✅ Il tuo evento "${event.title}" è stato approvato!`,
    categories: ["event-management", "approval"],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #27ae60; color: white; padding: 30px; text-align: center;">
          <h1>✅ Evento Approvato!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Ottima notizia, ${organizer.name}!</h2>
          <p>Il tuo evento <strong>"${
            event.title
          }"</strong> è stato approvato ed è ora visibile a tutti gli utenti.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📅 Dettagli Evento:</h3>
            <p><strong>Data:</strong> ${new Date(
              event.dateTime
            ).toLocaleDateString("it-IT")}</p>
            <p><strong>Ora:</strong> ${new Date(
              event.dateTime
            ).toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
            <p><strong>Luogo:</strong> ${event.location.venue}, ${
      event.location.city
    }</p>
            <p><strong>Genere:</strong> ${event.danceStyle}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/events/${event._id}" 
               style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Visualizza Evento
            </a>
          </div>
          
          <p>Inizia a promuovere il tuo evento sui social media e invita i tuoi amici!</p>
        </div>
      </div>
    `,
  }),

  // Event rejected
  eventRejected: (event, organizer, reason) => ({
    subject: `❌ Il tuo evento "${event.title}" richiede modifiche`,
    categories: ["event-management", "rejection"],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e74c3c; color: white; padding: 30px; text-align: center;">
          <h1>⚠️ Evento da Rivedere</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Ciao ${organizer.name},</h2>
          <p>Il tuo evento <strong>"${
            event.title
          }"</strong> ha bisogno di alcune modifiche prima di essere pubblicato.</p>
          
          ${
            reason
              ? `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4>💡 Motivo:</h4>
              <p>${reason}</p>
            </div>
          `
              : ""
          }
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🔧 Cosa fare:</h3>
            <ol>
              <li>Accedi alla tua area personale</li>
              <li>Modifica l'evento secondo le indicazioni</li>
              <li>Invia nuovamente per l'approvazione</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/my-ritmo" 
               style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Modifica Evento
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  // Event reminder
  eventReminder: (event, user) => ({
    subject: `🔔 Promemoria: "${event.title}" inizia tra 1 ora!`,
    categories: ["reminders", "events"],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f39c12; color: white; padding: 30px; text-align: center;">
          <h1>🔔 È quasi ora di ballare!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Ciao ${user.name}!</h2>
          <p>Il tuo evento <strong>"${
            event.title
          }"</strong> inizia tra circa 1 ora.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📍 Dettagli Evento:</h3>
            <p><strong>Ora:</strong> ${new Date(
              event.dateTime
            ).toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
            <p><strong>Luogo:</strong> ${event.location.venue}</p>
            <p><strong>Indirizzo:</strong> ${event.location.address}, ${
      event.location.city
    }</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/events/${event._id}" 
               style="background: #f39c12; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Dettagli Evento
            </a>
          </div>
          
          <p>🕺 Preparati a ballare e divertirti!</p>
        </div>
      </div>
    `,
  }),

  // New comment notification
  newCommentNotification: (event, comment, eventOwner) => ({
    subject: `💬 Nuovo commento su "${event.title}"`,
    categories: ["social", "comments"],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3498db; color: white; padding: 30px; text-align: center;">
          <h1>💬 Nuovo Commento!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Ciao ${eventOwner.name}!</h2>
          <p><strong>${
            comment.author.name
          }</strong> ha commentato il tuo evento "${event.title}":</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
            <p style="font-style: italic;">"${comment.content}"</p>
            ${
              comment.rating ? `<p>⭐ Valutazione: ${comment.rating}/5</p>` : ""
            }
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/events/${event._id}" 
               style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Visualizza Commento
            </a>
          </div>
        </div>
      </div>
    `,
  }),
};

// Public email functions
export const emailService = {
  // Send welcome email
  sendWelcomeEmail: async (user) => {
    const template = emailTemplates.welcome(user);
    return await sendEmail({
      to: user.email,
      from: process.env.EMAIL_FROM || "noreply@ritmocaribe.com",
      ...template,
    });
  },

  // Send event approval email
  sendEventApprovedEmail: async (event, organizer) => {
    const template = emailTemplates.eventApproved(event, organizer);
    return await sendEmail({
      to: organizer.email,
      from: process.env.EMAIL_FROM || "noreply@ritmocaribe.com",
      ...template,
    });
  },

  // Send event rejection email
  sendEventRejectedEmail: async (event, organizer, reason) => {
    const template = emailTemplates.eventRejected(event, organizer, reason);
    return await sendEmail({
      to: organizer.email,
      from: process.env.EMAIL_FROM || "noreply@ritmocaribe.com",
      ...template,
    });
  },

  // Send event reminder email
  sendEventReminderEmail: async (event, user) => {
    const template = emailTemplates.eventReminder(event, user);
    return await sendEmail({
      to: user.email,
      from: process.env.EMAIL_FROM || "noreply@ritmocaribe.com",
      ...template,
    });
  },

  // Send new comment notification
  sendNewCommentEmail: async (event, comment, eventOwner) => {
    const template = emailTemplates.newCommentNotification(
      event,
      comment,
      eventOwner
    );
    return await sendEmail({
      to: eventOwner.email,
      from: process.env.EMAIL_FROM || "noreply@ritmocaribe.com",
      ...template,
    });
  },

  // Send custom email
  sendCustomEmail: async (to, subject, html, categories = ["general"]) => {
    return await sendEmail({
      to,
      subject,
      html,
      categories,
    });
  },

  // Bulk email function for newsletters/broadcasts
  sendBulkEmail: async (
    recipients,
    subject,
    html,
    categories = ["broadcast"]
  ) => {
    try {
      // SendGrid supports up to 1000 recipients per API call
      const batchSize = 1000;
      const batches = [];

      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      const results = [];
      for (const batch of batches) {
        const msg = {
          to: batch.map((user) => ({ email: user.email, name: user.name })),
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || "noreply@ritmocaribe.com",
            name: process.env.SENDGRID_FROM_NAME || "RitmoCaribe",
          },
          subject,
          html,
          categories,
          isMultiple: true,
        };

        const response = await sgMail.sendMultiple(msg);
        results.push(response);
      }

      console.log(`✅ Bulk email sent to ${recipients.length} recipients`);
      return results;
    } catch (error) {
      console.error("❌ Bulk email error:", error);
      throw createError(500, "Errore nell'invio delle email bulk");
    }
  },

  // Verify SendGrid configuration
  verifyConfiguration: async () => {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error("SENDGRID_API_KEY not configured");
      }

      // Test with a simple API call (this doesn't send an email)
      const request = {
        method: "GET",
        url: "/v3/user/account",
      };

      await sgMail.request(request);
      return { configured: true, message: "SendGrid configured correctly" };
    } catch (error) {
      console.error("SendGrid configuration error:", error);
      return { configured: false, message: error.message };
    }
  },
};
