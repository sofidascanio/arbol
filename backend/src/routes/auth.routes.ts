import { Router } from 'express';
import { verifyToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { register, login, getMe } from '@/controllers/auth.controller';
import { registerSchema, loginSchema } from '@/schemas/auth.schema';

const router = Router();

router.post('/register', [...registerSchema, validate], register);
router.post('/login', [...loginSchema, validate], login);
router.get('/me', verifyToken, getMe);

export default router;