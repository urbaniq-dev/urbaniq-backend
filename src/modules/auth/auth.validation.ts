import Joi from 'joi';

export const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Admin', 'Owner', 'Agent', 'Buyer').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const sendOtpSchema = Joi.object({
  email: Joi.string().email().required()
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'OTP must contain only digits.',
    'string.length': 'OTP must be exactly 6 digits.'
  })
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const googleAuthSchema = Joi.object({
  idToken: Joi.string().required(),
});

export const googleRegisterSchema = Joi.object({
  idToken: Joi.string().required(),
  role: Joi.string().valid('Admin', 'Owner', 'Agent', 'Buyer').required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'OTP must contain only digits.',
    'string.length': 'OTP must be exactly 6 digits.'
  }),
  newPassword: Joi.string().min(6).required(),
});


