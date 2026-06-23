import { body, param } from 'express-validator';

export const createSchema = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre de la carpeta es obligatorio.')
        .isLength({ max: 100 })
        .withMessage('El nombre de la carpeta debe tener menos de 100 caracteres.'),
    body('parentId')
        .optional({ nullable: true })
        .isString()
        .withMessage('parentId tiene que ser un string'),
];

export const updateSchema = [
    param('id').notEmpty().withMessage('El ID de la carpeta es obligatorio.'),
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El nombre no puede estar vacio.')
        .isLength({ max: 100 }),
    body('parentId')
        .optional({ nullable: true })
        .isString()
        .withMessage('parentId tiene que ser string o null.'),
];