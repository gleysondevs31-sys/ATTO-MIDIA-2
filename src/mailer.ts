import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "smtp.example.com";
const port = parseInt(process.env.SMTP_PORT || "587", 10);
const user = process.env.SMTP_USER || "user@example.com";
const pass = process.env.SMTP_PASS || "password";
export const fromEmail = process.env.SMTP_FROM || "noreply@attodownloads.com";

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true for 465, false for other ports
  auth: {
    user,
    pass,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"ATTO Downloads" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log("Email enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
};
