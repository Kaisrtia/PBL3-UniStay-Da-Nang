import Joi from 'joi';

const email = Joi.string().trim().lowercase().email().max(255).required();
const password = Joi.string().min(8).max(72).required();

export const registerSchema = {
  body: Joi.object({
    email,
    password,
    fullName: Joi.string().trim().min(1).max(100).required()
  })
};

export const loginSchema = {
  body: Joi.object({ email, password })
};

export const googleLoginSchema = {
  body: Joi.object({
    idToken: Joi.string().max(4096).required()
  })
};

export const emailVerificationRequestSchema = {
  body: Joi.object({ email })
};

export const verifyEmailSchema = {
  body: Joi.object({
    email,
    code: Joi.string().pattern(/^\d{6}$/).required()
  })
};

export const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().hex().length(64).required(),
    newPassword: password
  })
};
