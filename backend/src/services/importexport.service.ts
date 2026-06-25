import { prisma } from '@/utils/prisma';
import { AppError } from '@/middleware/errorHandler';
import {
    parseNetscapeHTML,
    generateNetscapeHTML,
    NetscapeBookmark,
} from '@/utils/netscape';

// tipos 
export interface ImportResult {
    imported: number;
    skipped: number;
    failed: number;
    errors: string[];
}

export interface ExportOptions {
    format: 'html' | 'json';
    folderId?: string;
    tagName?: string;
}

// exportar 
export const exportBookmarks = async (
    userId: string,
    options: ExportOptions
): Promise<{ content: string; filename: string; mimeType: string }> => {
    const where = {
        userId,
        ...(options.folderId ? { folderId: options.folderId } : {}),
        ...(options.tagName
        ? { tags: { some: { tag: { name: options.tagName } } } }
        : {}),
    };

    const bookmarks = await prisma.bookmark.findMany({
        where,
        include: {
            folder: { select: { name: true } },
            tags: { include: { tag: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (options.format === 'json') {
        const data = {
            exportedAt: new Date().toISOString(),
            total: bookmarks.length,
            bookmarks: bookmarks.map(bm => ({
                title: bm.title,
                url: bm.url,
                description: bm.description,
                folder: bm.folder?.name ?? null,
                tags: bm.tags.map(bt => bt.tag.name),
                createdAt: bm.createdAt.toISOString(),
            })),
        };

        return {
            content: JSON.stringify(data, null, 2),
            filename: `bookmarks-${timestamp}.json`,
            mimeType: 'application/json',
        };
    }

    // Formato HTML Netscape (default)
    const html = generateNetscapeHTML(bookmarks);

    return {
        content: html,
        filename: `bookmarks-${timestamp}.html`,
        mimeType: 'text/html',
    };
};

// importar desde html netscape 
export const importFromNetscape = async (
    userId: string,
    html: string,
    options: {
        skipDuplicates?: boolean;
        defaultFolderId?: string;
    } = {}
): Promise<ImportResult> => {
    const { skipDuplicates = true, defaultFolderId } = options;

    const parsed = parseNetscapeHTML(html);

    if (parsed.length === 0) {
        throw new AppError('No se encontraron marcadores en el archivo', 400);
    }

    const result: ImportResult = {
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [],
    };

    // cache de carpetas para no hacer queries repetidas
    const folderCache = new Map<string, string>(); // nombre → id

    // obtiene urls existentes del usuario para detectar duplicados
    const existingUrls = skipDuplicates
        ? new Set(
            (await prisma.bookmark.findMany({
                where: { userId },
                select: { url: true },
            })).map(b => b.url)
        )
        : new Set<string>();

    for (const bm of parsed) {
        try {
            // verifica duplicado
            if (skipDuplicates && existingUrls.has(bm.url)) {
                result.skipped++;
                continue;
            }

            // resuelve carpeta
            let folderId: string | null = defaultFolderId ?? null;

            if (bm.folderPath && bm.folderPath.length > 0) {
                folderId = await resolveFolder(
                    userId,
                    bm.folderPath,
                    folderCache
                );
            }

            // resuelve tags
            const tagIds = await resolveTags(bm.tags ?? []);

            // crea marcador
            await prisma.bookmark.create({
                data: {
                    title: bm.title,
                    url: bm.url,
                    userId,
                    folderId,
                    createdAt: bm.addDate
                        ? new Date(bm.addDate * 1000)
                        : new Date(),
                    tags: {
                        create: tagIds.map(tagId => ({ tagId })),
                    },
                },
            });

            existingUrls.add(bm.url);
            result.imported++;
        } catch (error) {
            result.failed++;
            result.errors.push(
                `Error al importar "${bm.title}": ${
                error instanceof Error ? error.message : 'Error desconocido'
                }`
            );
        }
    }

    return result;
};

// importar desde JSON 
export const importFromJSON = async (
    userId: string,
    jsonStr: string,
    options: { skipDuplicates?: boolean } = {}
): Promise<ImportResult> => {
    const { skipDuplicates = true } = options;

    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonStr);
    } catch {
        throw new AppError('El archivo JSON no es válido', 400);
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new AppError('Estructura de JSON inválida', 400);
    }

    const data = parsed as Record<string, unknown>;

    // acepta tanto el formato propio como arrays planos
    const rawBookmarks: unknown[] = Array.isArray(data)
        ? data
        : Array.isArray(data.bookmarks)
        ? (data.bookmarks as unknown[])
        : [];

    if (rawBookmarks.length === 0) {
        throw new AppError('No se encontraron marcadores en el archivo JSON', 400);
    }

    const result: ImportResult = {
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [],
    };

    const existingUrls = skipDuplicates
        ? new Set(
            (await prisma.bookmark.findMany({
                where: { userId },
                select: { url: true },
            })).map(b => b.url)
        )
        : new Set<string>();

    const folderCache = new Map<string, string>();

    for (const raw of rawBookmarks) {
        try {
            if (!raw || typeof raw !== 'object') continue;

            const bm = raw as Record<string, unknown>;

            const url = String(bm.url ?? '');
            const title = String(bm.title ?? url);

            if (!url) continue;

            // valida URL
            try { new URL(url); } catch { continue; }

            if (skipDuplicates && existingUrls.has(url)) {
                result.skipped++;
                continue;
            }

            // resuelve carpeta
            let folderId: string | null = null;
            const folderName = typeof bm.folder === 'string' ? bm.folder : null;
            if (folderName) {
                folderId = await resolveFolder(userId, [folderName], folderCache);
            }

            // resulve tags
            const rawTags = Array.isArray(bm.tags)
                ? bm.tags.map(String)
                : [];
            const tagIds = await resolveTags(rawTags);

            await prisma.bookmark.create({
                data: {
                    title,
                    url,
                    description: typeof bm.description === 'string'
                        ? bm.description
                        : undefined,
                    userId,
                    folderId,
                    createdAt: bm.createdAt
                        ? new Date(String(bm.createdAt))
                        : new Date(),
                    tags: {
                        create: tagIds.map(tagId => ({ tagId })),
                    },
                },
            });

            existingUrls.add(url);
            result.imported++;
        } catch (error) {
            result.failed++;
            result.errors.push(
                error instanceof Error ? error.message : 'Error al importar entrada'
            );
        }
    }

    return result;
};

// helpers privados 

// resuelve o creaa la cadena de carpetas dada una ruta
// ['Trabajo', 'Frontend'] -> crea Trabajo -> crea Frontend dentro de Trabajo -> devuelve id de Frontend
const resolveFolder = async (
    userId: string,
    path: string[],
    cache: Map<string, string>
): Promise<string> => {
    let parentId: string | null = null;

    for (const segment of path) {
        const cacheKey: string = `${parentId ?? 'root'}/${segment}`;

        if (cache.has(cacheKey)) {
            parentId = cache.get(cacheKey)!;
            continue;
        }

        let folder: { id: string; name: string } | null =
            await prisma.folder.findFirst({
                where: { name: segment, userId, parentId },
                select: { id: true, name: true },
            });

        if (!folder) {
            folder = await prisma.folder.create({
                data: { name: segment, userId, parentId },
                select: { id: true, name: true },
            });
        }

        cache.set(cacheKey, folder.id);
        parentId = folder.id;
    }

    return parentId!;
};

// resuelve o crea tags globales
const resolveTags = async (tagNames: string[]): Promise<string[]> => {
    const ids: string[] = [];

    for (const name of tagNames.map(t => t.toLowerCase().trim()).filter(Boolean)) {
        const tag = await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
        });
        ids.push(tag.id);
    }

    return ids;
};