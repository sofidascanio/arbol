import { Request, Response, NextFunction } from 'express';
import { sendError } from '@/utils/response';

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'AppError';
        // necesario para que instanceof funcione con clases que extienden Error
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

// middleware de manejo de errores 
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error(`[Error] ${err.message}`);

    if (err instanceof AppError) {
        sendError(res, err.message, err.statusCode);
        return;
    }

    sendError(res, 'Internal server error', 500);
};