import { body, param, query } from 'express-validator';

export const getPopularSchema = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('El límite debe ser entre 1 y 50'),
];

export const addTagsSchema = [
    param('bookmarkId').notEmpty().withMessage('ID de marcador requerido'),
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
    param('bookmarkId').notEmpty().withMessage('ID de marcador requerido'),
    param('tagName').notEmpty().withMessage('Nombre de etiqueta requerido'),
];