import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { sendSuccess, sendError } from '@/utils/response';
import {
  exportBookmarks,
  importFromNetscape,
  importFromJSON,
} from '@/services/importexport.service';
import { AppError } from '@/middleware/errorHandler';
import { prisma } from '@/utils/prisma';

// exporta los bookmarks en formato html (netscape) o json
export const exportBookmarksController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const format = (req.query.format as 'html' | 'json') ?? 'html';

        const { content, filename, mimeType } = await exportBookmarks(
            req.user!.id,
            {
                format,
                folderId: req.query.folderId as string | undefined,
                tagName: req.query.tag as string | undefined,
            }
        );

        // envia como descarga
        res.setHeader('Content-Type', `${mimeType}; charset=utf-8`);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );
        res.send(content);
    } catch (error) {
        next(error);
    }
};

// importa bookmarks desde un archivo html (netscape) o json
export const importBookmarks = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.file) {
            sendError(res, 'No se recibió ningún archivo', 400);
            return;
        }

        const content = req.file.buffer.toString('utf-8');
        const skipDuplicates = req.body.skipDuplicates !== 'false';
        const defaultFolderId = req.body.folderId as string | undefined;

        // detecta formato por extension o contenido
        const filename = req.file.originalname.toLowerCase();
        let result;

        if (
            filename.endsWith('.json') ||
                req.file.mimetype === 'application/json'
        ) {
            result = await importFromJSON(req.user!.id, content, {
                skipDuplicates,
            });
        } else if (
                filename.endsWith('.html') ||
                filename.endsWith('.htm') ||
                content.includes('NETSCAPE-Bookmark-file')
        ) {
            result = await importFromNetscape(req.user!.id, content, {
                skipDuplicates,
                defaultFolderId,
            });
        } else {
            throw new AppError(
                'Formato de archivo no reconocido. Usá un archivo .html (Netscape) o .json',
                400
            );
        }

        sendSuccess(
            res,
            result,
            `Importación completada: ${result.imported} marcadores importados`
        );
    } catch (error) {
        next(error);
    }
};

// previsualiza que se importaria sin hacer cambios en la bd
export const previewImport = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.file) {
            sendError(res, 'No se recibió ningún archivo', 400);
            return;
        }

        const content = req.file.buffer.toString('utf-8');
        const filename = req.file.originalname.toLowerCase();

        let bookmarks: { title: string; url: string; folderPath?: string[] }[] = [];

        if (filename.endsWith('.json') || req.file.mimetype === 'application/json') {
            const data = JSON.parse(content);
            const raw = Array.isArray(data) ? data : data.bookmarks ?? [];
            bookmarks = raw
                .filter((b: Record<string, unknown>) => b.url)
                .map((b: Record<string, unknown>) => ({
                title: String(b.title ?? b.url),
                url: String(b.url),
                }));
        } else {
            const { parseNetscapeHTML } = await import('@/utils/netscape');
            bookmarks = parseNetscapeHTML(content);
        }

        // verifica duplicados
        const existingUrls = new Set(
            (await prisma.bookmark.findMany({
                where: { userId: req.user!.id },
                select: { url: true },
            })).map(b => b.url)
        );

        const preview = {
            total: bookmarks.length,
            new: bookmarks.filter(b => !existingUrls.has(b.url)).length,
            duplicates: bookmarks.filter(b => existingUrls.has(b.url)).length,
            sample: bookmarks.slice(0, 5).map(b => ({
                title: b.title,
                url: b.url,
                isDuplicate: existingUrls.has(b.url),
                folder: b.folderPath?.join(' / ') ?? null,
            })),
        };

        sendSuccess(res, preview);
    } catch (error) {
        next(error);
    }
};