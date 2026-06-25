import { query } from 'express-validator';

// esquema de validacion para exportacion de bookmarks
export const exportValidations = [
  query('format')
    .optional()
    .isIn(['html', 'json'])
    .withMessage('El formato debe ser html o json'),
  query('folderId')
    .optional()
    .isString()
    .withMessage('folderId debe ser un string'),
  query('tag')
    .optional()
    .isString()
    .withMessage('tag debe ser un string'),
];