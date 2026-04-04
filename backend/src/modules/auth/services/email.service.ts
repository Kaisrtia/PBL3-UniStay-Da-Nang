import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { AppError } from '../../../core/exceptions/AppError';
import config from '../../../core/config/config';

export const sendEmailOtpCode = async (email: string) => {
  if (!email) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email is required!');
  }

  // Check if the email exists in the database
  const user = await prismaClient.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true }
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Email not found');
  }

  // Check if the user's email is already verified
  if (user.emailVerified) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email already verified');
  }

  // Check if there is an existing verification token that has not expired
  const existingToken = await prismaClient.email_verification.findFirst({
    where: {
      email: email
    }
  });

  if (
    existingToken &&
    existingToken.expiresAt &&
    existingToken.expiresAt > new Date()
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Verification email already sent'
    );
  }

  // Generate a new verification token and save it to the database
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(
    Date.now() + Number(config.email.verification_ttl)
  );
  await prismaClient.email_verification.update({
    where: {
      email
    },
    data: {
      code,
      expiresAt
    }
  });

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.password
    }
  });

  const mailOptions = {
    from: config.email.user,
    to: email,
    subject: 'Verify your email',
    text: `Your verification code is: ${code}`
  };

  await transporter.sendMail(mailOptions);
};

export const verifyEmailOtpCode = async (email: string, code: string) => {
  if (!email || !code) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email and code are required!');
  }

  // Check if the email exists in the database
  const user = await prismaClient.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true }
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Email not found');
  }

  // Check if the user's email is already verified
  if (user.emailVerified) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email already verified');
  }

  // Check if there is an existing verification token that has not expired
  const existingToken = await prismaClient.email_verification.findFirst({
    where: {
      email: email
    }
  });

  if (
    !existingToken ||
    !existingToken.expiresAt ||
    existingToken.expiresAt <= new Date()
  ) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      'Verification email not found or expired'
    );
  }

  // Check if the verification code matches
  if (existingToken.code !== code) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid verification code');
  }

  // Mark the email as verified
  await prismaClient.user.update({
    where: {
      email
    },
    data: {
      emailVerified: true,
      status: 'SET_UP'
    }
  });

  // Delete the verification token
  await prismaClient.email_verification.delete({
    where: {
      email
    }
  });
};
