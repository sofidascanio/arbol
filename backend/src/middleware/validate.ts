import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '@/types';
import { sendError } from '@/utils/response';

export const validate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg);
        sendError(res, 'No se pudo validar.', 400, messages);
        return;
    }

    next();
};