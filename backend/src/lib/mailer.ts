import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config();

// NOTE(changed): switched from Resend (third-party email API) to plain
// SMTP via nodemailer, so we send through our own mailbox
// (customerpulse@sanghviglobal.com) instead of a shared Resend sender.
//
// Required .env vars (see .env.example):
//   SMTP_HOST       e.g. smtp.office365.com  (Microsoft 365 / Outlook)
//   SMTP_PORT       587 (STARTTLS) - use 465 only if SMTP_SECURE=true
//   SMTP_SECURE     "true" for port 465 (implicit TLS), otherwise leave unset/"false"
//   SMTP_USER       customerpulse@sanghviglobal.com
//   SMTP_PASS       the mailbox's app password (NOT the normal login
//                   password - see note below, MFA is enabled on this account)
//   MAIL_FROM       "Sanghvi Movers Ltd <customerpulse@sanghviglobal.com>"
//
// Because MFA is turned on for this mailbox, the account's regular sign-in
// password will NOT work here - SMTP AUTH needs either:
//   (a) an app password generated for this account (works only if your
//       Microsoft 365 tenant still allows Basic Auth / app passwords for
//       SMTP AUTH on this mailbox), or
//   (b) OAuth2 (XOAUTH2) if your tenant has Basic Auth/legacy auth blocked
//       by Conditional Access - a different, more involved setup.
// See the chat notes for the exact steps to check which situation applies
// and how to generate the app password.
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailInput) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"Sanghvi Movers Ltd" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[mailer] failed to send "${subject}" to ${to}:`, err);
  }
}
