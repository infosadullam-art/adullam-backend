// lib/email.ts
import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.MAILTRAP_TOKEN || "bd9e1847357efc012bf28b020fdf6613";

// Initialiser le client Mailtrap
const client = new MailtrapClient({ token: TOKEN });

export async function sendEmail(email: string, code: string) {
  try {
    console.log("📧 Tentative d'envoi d'email Mailtrap à:", email);

    const sender = {
      email: "hello@demomailtrap.co",
      name: "Adullam",
    };

    const response = await client.send({
      from: sender,
      to: [{ email }],
      subject: "Votre code de vérification Adullam",
      text: `Votre code de vérification est : ${code}. Ce code est valable pendant 10 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Code de vérification Adullam</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f6f9fc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 480px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              padding: 32px;
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo {
              width: 64px;
              height: 64px;
              background: #1a1a1a;
              border-radius: 16px;
              margin: 0 auto 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 32px;
              font-weight: bold;
            }
            .code {
              background: #f0f0f0;
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              font-size: 48px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #1a1a1a;
              font-family: monospace;
              margin: 24px 0;
            }
            .warning {
              color: #666;
              font-size: 14px;
              text-align: center;
              border-top: 1px solid #eaeaea;
              padding-top: 24px;
              margin-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">A</div>
              <h1>Adullam</h1>
            </div>
            
            <p style="font-size: 16px; color: #333;">Bonjour,</p>
            <p style="font-size: 16px; color: #333;">
              Voici votre code de vérification pour créer votre compte :
            </p>
            
            <div class="code">${code}</div>
            
            <p style="font-size: 14px; color: #666;">
              Ce code est valable pendant 10 minutes.
            </p>
            
            <div class="warning">
              ⚠️ Si vous n'avez pas demandé ce code, ignorez cet email.
            </div>
          </div>
        </body>
        </html>
      `,
      category: "Vérification de compte",
    });

    console.log("✅ Email envoyé avec succès via Mailtrap:", response);
    return true;
  } catch (error) {
    console.error("❌ Erreur Mailtrap:", error);
    
    // EN DÉVELOPPEMENT : Simuler l'envoi pour ne pas bloquer
    if (process.env.NODE_ENV === 'development') {
      console.log("📧 MODE DÉVELOPPEMENT - Code simulé:", code);
      console.log(`📧 À envoyer à: ${email}`);
      return true;
    }
    
    return false;
  }
}