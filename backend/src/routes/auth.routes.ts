import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '@/middleware/validate';
import { verifyToken } from '@/middleware/auth';
import { register, login, getMe } from '@/controllers/auth.controller';

const router = Router();

const emailValidation = body('email')
  .isEmail()
  .withMessage('Must be a valid email address')
  .normalizeEmail();

const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number');

router.post('/register', [emailValidation, passwordValidation, validate], register);

router.post('/login', [emailValidation, validate], login);

router.get('/me', verifyToken, getMe);

export default router;