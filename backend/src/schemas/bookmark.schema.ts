import { body, param, query } from 'express-validator';

export const listSchema = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page tiene que ser un numero entero mayor a cero.'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit tiene que ser un numero entre 1 y 100.'),
    query('search').optional().trim().isLength({ max: 200 }),
    query('folderId').optional().isString(),
    query('tag').optional().trim().isLength({ max: 50 }),
];

export const createSchema = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('El titulo es obligatorio.')
        .isLength({ max: 255 })
        .withMessage('El titulo debe tener menos de 255 caracteres.'),
    body('url')
        .trim()
        .notEmpty()
        .withMessage('La URL es obligatoria.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La descripción debe tener menos de 1000 caracteres.'),
    body('folderId')
        .optional()
        .isString()
        .withMessage('folderID tiene que ser un string.'),
    body('tagNames')
        .optional()
        .isArray()
        .withMessage('tagNames tiene que ser un arreglo.'),
    body('tagNames.*')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Cada etiqueta debe tener entre 1 y 50 caracteres.'),
];

export const updateSchema = [
    param('id').notEmpty().withMessage('El ID del marcador es obligatorio.'),
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El titulo es obligatorio.')
        .isLength({ max: 255 }),
    body('url')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('La URL no puede estar vacia.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }),
    body('folderId')
        .optional({ nullable: true })
        .isString()
        .withMessage('folderId debe ser un string o null.'),
    body('tagNames')
        .optional()
        .isArray()
        .withMessage('tagNames debe ser un arreglo.'),
];

export const favoriteSchema = [
    param('id')
        .notEmpty()
        .withMessage('El ID del marcador es obligatorio.')
];