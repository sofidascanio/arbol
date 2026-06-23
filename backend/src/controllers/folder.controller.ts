import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { sendSuccess } from '@/utils/response';
import {
  getFolderTree,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  getBreadcrumb,
} from '@/services/folder.service';


// obtiene arbol completo de carpetas del usuario
export const getTree = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const tree = await getFolderTree(req.user!.id);
        sendSuccess(res, { folders: tree });
    } catch (error) {
        next(error);
    }
};

// obtiene una carpeta por id (solo si pertenece al usuario)
export const getOne = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const folder = await getFolderById(req.params.id, req.user!.id);
        sendSuccess(res, { folder });
    } catch (error) {
        next(error);
    }
};

// obtiene breadcrumb de una carpeta (ruta desde la raiz)
export const getBreadcrumbHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const breadcrumb = await getBreadcrumb(req.params.id, req.user!.id);
        sendSuccess(res, { breadcrumb });
    } catch (error) {
        next(error);
    }
};

// crear carpeta
export const create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const folder = await createFolder(req.user!.id, req.body);
        sendSuccess(res, { folder }, 'Carpeta creada.', 201);
    } catch (error) {
        next(error);
    }
};

// actualizar carpeta
export const update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const folder = await updateFolder(req.params.id, req.user!.id, req.body);
        sendSuccess(res, { folder }, 'Carpeta actualizada.');
    } catch (error) {
        next(error);
    }
};

// elimina carpeta (y sus subcarpetas)
export const remove = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await deleteFolder(req.params.id, req.user!.id);
        sendSuccess(
            res,
            result,
            `Carpeta y ${result.deletedFolders - 1} subcarpetas eliminadas.`
        );
    } catch (error) {
        next(error);
    }
};