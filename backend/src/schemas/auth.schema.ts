import { body } from 'express-validator';

export const usernameValidation = body('username')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 30 })
    .withMessage('Debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Solo letras, números y guión bajo');

export const passwordValidation = body('password')
    .isLength({ min: 8 })
    .withMessage('Debe tener mínimo 8 caracteres.')
    .matches(/[A-Z]/)
    .withMessage('Debe contener al menos una letra mayuscula.')
    .matches(/[0-9]/)
    .withMessage('Debe contener al menos un número.');

export const registerSchema = [usernameValidation, passwordValidation];

export const loginSchema = [usernameValidation];