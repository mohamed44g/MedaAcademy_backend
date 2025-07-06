import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: '916534001@smtp-brevo.com', // الإيميل بتاعك على Brevo
    pass: 'MTx2rqBD1NaVZvIw', // الـ API Key بتاع Brevo
  },
});
