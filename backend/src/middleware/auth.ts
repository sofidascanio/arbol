import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthPayload } from '@/types';
import { sendError } from '@/utils/response';

export const verifyToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    // extrae token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(res, 'No se encontro el token.', 401);
        return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        sendError(res, 'Error de configuración de servidor.', 500);
        return;
    }

    try {
        const decoded = jwt.verify(token, secret) as AuthPayload;
        req.user = decoded; // adjunta datos del usuario al request
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            sendError(res, 'Token expirado.', 401);
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            sendError(res, 'Token invalido.', 401);
            return;
        }
        sendError(res, 'No se pudo autenticar el usuario.', 401);
    }
};