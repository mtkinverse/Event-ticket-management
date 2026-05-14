import nodemailer from 'nodemailer';
import { config } from '../../configs/index.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
  });
  return transporter;
};

export const emailChannel = {
  name: 'email',
  send: async ({ to, subject, html, attachments }) => {
    const info = await getTransporter().sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
      attachments,
    });
    return { providerId: info.messageId };
  },
};
