import { Router } from 'express';
<<<<<<< Updated upstream
import { registerUser, loginUser, googleAuth } from './auth.controller';
=======
import { registerUser, loginUser, googleAuth, refreshToken, logout, getMe } from './auth.controller';
>>>>>>> Stashed changes

import { validate } from '../../core/middlewares/validate.middleware';
import { protect } from '../../core/middlewares/auth.middleware';
import { registerSchema, loginSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);

export default router;
