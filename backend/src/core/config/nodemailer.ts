import nodemailer from 'nodemailer';
import config from './config';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

export default transporter;
