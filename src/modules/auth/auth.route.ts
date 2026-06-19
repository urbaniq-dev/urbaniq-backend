import { Router } from 'express';
import { registerUser, loginUser, googleAuth } from './auth.controller';

import { validate } from '../../core/middlewares/validate.middleware';
import { registerSchema, loginSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/google', googleAuth);

export default router;
