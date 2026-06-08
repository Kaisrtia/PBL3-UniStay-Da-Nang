import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { AppError } from '../../../core/exceptions/AppError';
import config from '../../../core/config/config';
import transporter from '../../../core/config/nodemailer';
import {
  isStrongPassword,
  strongPasswordMessage
} from '../../../core/utils/passwordPolicy';



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


  const mailOptions = {
    from: config.email.user,
    to: email,
    subject: 'Verify your email',
    text: `Your verification code is: ${code}`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch {
    await prismaClient.email_verification.update({
      where: { email },
      data: { code: null, expiresAt: null }
    });
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send verification email'
    );
  }
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

  await prismaClient.$transaction([
    prismaClient.user.update({
      where: {
        email
      },
      data: {
        emailVerified: true,
        status: 'SET_UP'
      }
    }),
    prismaClient.email_verification.delete({
      where: {
        email
      }
    })
  ]);
};

const cleanupPasswordResetToken = async (email: string) => {
  await prismaClient.email_verification.deleteMany({
    where: { email }
  });
};

export const sendPasswordResetLink = async (email: string) => {
  if (!email) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email is required!');
  }

  const user = await prismaClient.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true, provider: true }
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Email not found');
  }

  if (!user.emailVerified) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email is not verified');
  }

  if (user.provider === 'GOOGLE') {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Google accounts cannot reset password this way'
    );
  }

  // Check if there is an existing token that has not expired
  const existingRecord = await prismaClient.email_verification.findFirst({
    where: { email }
  });

  if (
    existingRecord &&
    existingRecord.expiresAt &&
    existingRecord.expiresAt > new Date()
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Reset link already sent, please wait before requesting again'
    );
  }

  // Generate a secure random token and store it in the code field
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + Number(config.email.verification_ttl));

  await prismaClient.email_verification.upsert({
    where: { email },
    update: { code: token, expiresAt },
    create: { email, code: token, expiresAt }
  });

  const resetLink = `${config.frontend_url}/reset-password?token=${token}`;


  const mailOptions = {
    from: config.email.user,
    to: email,
    subject: 'Reset your password - UniStay',
    html: `
      <p>You requested a password reset for your UniStay account.</p>
      <p>Click the link below to reset your password. This link will expire in 10 minutes.</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>If you did not request this, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch {
    await cleanupPasswordResetToken(email);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send password reset email'
    );
  }
};

export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
) => {
  if (!token || !newPassword) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Token and new password are required!'
    );
  }

  if (!isStrongPassword(newPassword)) {
    throw new AppError(HttpStatus.BAD_REQUEST, strongPasswordMessage);
  }

  // Look up the record by token (stored in the code field)
  const record = await prismaClient.email_verification.findFirst({
    where: { code: token }
  });

  if (!record || !record.expiresAt || record.expiresAt <= new Date()) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Reset link is invalid or has expired'
    );
  }

  const newHashedPassword = bcrypt.hashSync(newPassword, 10);

  await prismaClient.$transaction([
    prismaClient.user.update({
      where: { email: record.email },
      data: { hashedPassword: newHashedPassword }
    }),
    prismaClient.email_verification.delete({
      where: { email: record.email }
    })
  ]);
};
