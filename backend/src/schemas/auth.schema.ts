import { body } from 'express-validator';

export const emailValidation = body('email')
    .isEmail()
    .withMessage('Tiene que ser un email valido')
    .normalizeEmail();

export const passwordValidation = body('password')
    .isLength({ min: 8 })
    .withMessage('Debe tener mínimo 8 caracteres.')
    .matches(/[A-Z]/)
    .withMessage('Debe contener al menos una letra mayuscula.')
    .matches(/[0-9]/)
    .withMessage('Debe contener al menos un número.');

export const registerSchema = [emailValidation, passwordValidation];

export const loginSchema = [emailValidation];