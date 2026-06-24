import { Router } from 'express';
import {
  registerUser,
  loginUser,
  googleAuth,
  googleRegister,
  sendOTP,
  verifyOTP,
  refreshSession,
  logoutUser,
} from './auth.controller';

import { validate } from '../../core/middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshSchema,
  logoutSchema,
  googleAuthSchema,
  googleRegisterSchema,
} from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/google', validate(googleAuthSchema), googleAuth);
router.post('/google/register', validate(googleRegisterSchema), googleRegister);
router.post('/send-otp', validate(sendOtpSchema), sendOTP);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOTP);
router.post('/refresh', validate(refreshSchema), refreshSession);
router.post('/logout', validate(logoutSchema), logoutUser);

export default router;
