import { Request } from 'express';
// extiende el request de express para incluir el usuario autenticado

export interface AuthPayload {
    id: string;
    email: string;
}

// request tipado con usuario (middleware auth)
export interface AuthRequest extends Request {
    user?: AuthPayload;
}

// respuesta estandar de la api
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

// paginacion
export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}