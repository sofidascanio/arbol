import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { sendSuccess } from '@/utils/response';
import {
  listUserTags,
  getPopularTags,
  addTagsToBookmark,
  removeTagFromBookmark,
  getBookmarkTags,
} from '@/services/tag.service';

// lista todos los tags del usuario
export const list = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const tags = await listUserTags(req.user!.id);
        sendSuccess(res, { tags });
    } catch (error) {
        next(error);
    }
};

// obtiene tags mas usados por el usuario
export const getPopular = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const tags = await getPopularTags(req.user!.id, limit);
        sendSuccess(res, { tags });
    } catch (error) {
        next(error);
    }
};

// obtiene tags de un marcador
export const getBookmarkTagsHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const tags = await getBookmarkTags(req.params.bookmarkId, req.user!.id);
        sendSuccess(res, { tags });
    } catch (error) {
        next(error);
    }
};

// agrega nuevos tags a un marcador
export const addTags = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await addTagsToBookmark(
            req.params.bookmarkId,
            req.user!.id,
            req.body.tagNames
        );
        sendSuccess(res, null, 'Etiquetas agregadas correctamente');
    } catch (error) {
        next(error);
    }
};


// elimina un tag de un marcador
export const removeTag = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await removeTagFromBookmark(
            req.params.bookmarkId,
            req.user!.id,
            req.params.tagName
        );
        sendSuccess(res, null, 'Etiqueta eliminada correctamente');
    } catch (error) {
        next(error);
    }
};