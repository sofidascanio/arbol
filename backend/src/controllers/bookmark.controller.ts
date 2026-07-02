import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { sendSuccess, sendError } from '@/utils/response';
import {
  listBookmarks,
  getBookmarkById,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  toggleFav,
  refreshBookmarkMetadata
} from '@/services/bookmark.service';

// lista de bookmarks del usuario autenticado, con filtros y paginacion
export const list = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await listBookmarks(userId, {
            page,
            limit,
            search: req.query.search as string | undefined,
            folderId: req.query.folderId as string | undefined,
            tagName: req.query.tag as string | undefined,
            favoritesOnly: req.query.favoritesOnly === 'true',
            sortBy: (req.query.sortBy as 'createdAt' | 'title') || 'createdAt', 
            sortDir: (req.query.sortDir as 'asc' | 'desc') || 'desc',  
        });

        sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

// obtiene bookmark por id (si pertenece al usuario)
export const getOne = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const bookmark = await getBookmarkById(req.params.id, req.user!.id);
        sendSuccess(res, { bookmark });
    } catch (error) {
        next(error);
    }
};

// crear bookmark
export const create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const bookmark = await createBookmark(req.user!.id, req.body);
        sendSuccess(res, { bookmark }, 'Marcador creado', 201);
    } catch (error) {
        next(error);
    }
};

// actualizar bookmark
export const update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const bookmark = await updateBookmark(
            req.params.id,
            req.user!.id,
            req.body
        );
        sendSuccess(res, { bookmark }, 'Marcador actualizado.');
    } catch (error) {
        next(error);
    }
};

// eliminar bookmark
export const remove = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await deleteBookmark(req.params.id, req.user!.id);
        sendSuccess(res, null, 'Marcador eliminado.');
    } catch (error) {
        next(error);
    }
};

export const toggleFavorite = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await toggleFav(req.params.id, req.user!.id);

        if (!result.success) {
            sendError(res, result.error!, result.statusCode!);
            return;
        }

        if (!result.data) {
            sendError(res, 'Error al obtener el marcador', 500);
            return;
        }

        sendSuccess(res, { bookmark: result.data.bookmark }, result.message);
    } catch (error) {
        next(error);
    }
};

export const refreshMetadata = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const updated = await refreshBookmarkMetadata(
            req.params.id,
            req.user!.id
        );
        sendSuccess(res, { bookmark: updated }, 'Metadata actualizada');
    } catch (error) {
        next(error);
    }
};