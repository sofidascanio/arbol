import { body, param, query } from 'express-validator';

export const getPopularSchema = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('El límite debe ser entre 1 y 50'),
];

export const addTagsSchema = [
    param('bookmarkId').notEmpty().withMessage('ID de marcador obligatorio'),
    body('tagNames')
        .isArray({ min: 1 })
        .withMessage('Se requiere al menos una etiqueta'),
    body('tagNames.*')
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Cada etiqueta debe tener entre 1 y 50 caracteres'),
];

export const removeTagSchema = [
    param('bookmarkId').notEmpty().withMessage('ID de marcador obligatorio'),
    param('tagName').notEmpty().withMessage('Nombre de etiqueta obligatorio'),
];

export const updateColorSchema = [
    param('tagId').notEmpty().withMessage('ID de etiqueta obligatorio'),
    body('color')
        .matches(/^#[0-9a-fA-F]{6}$/)
        .withMessage('Color debe ser un hex válido (#rrggbb)'),
]

export const createTagSchema = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ max: 50 })
        .withMessage('Máximo 50 caracteres'),
    body('color')
        .optional()
        .matches(/^#[0-9a-fA-F]{6}$/)
        .withMessage('Color debe ser un hex válido (#rrggbb)'),
]