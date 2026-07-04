import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { registerUser, loginUser, getUserById } from '@/services/auth.service';
import { sendSuccess } from '@/utils/response';

// registrar nuevo usuario
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { username, password } = req.body;
        const result = await registerUser(username, password);
        sendSuccess(res, result, 'Se registro exitosamente el usuario.', 201);
    } catch (error) {
        next(error);
    }
};

// Iniciar sesion
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { username, password } = req.body as { username: string; password: string };

        if (!password) {
        res.status(400).json({
            success: false,
            message: 'Fallo la validación',
            errors: ['Se necesita una contraseña'],
        });
        return;
        }

        const result = await loginUser(username, password);
        sendSuccess(res, result, 'Login exitoso');
    } catch (error) {
        next(error);
    }
};

// obtiene datos del usuario autenticado
export const getMe = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
        res.status(401).json({ success: false, message: 'Sin autorización' });
        return;
        }

        const user = await getUserById(req.user.id);
        sendSuccess(res, { user });
    } catch (error) {
        next(error);
    }
};