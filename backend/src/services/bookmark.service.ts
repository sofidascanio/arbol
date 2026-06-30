import { prisma } from '@/utils/prisma';
import { AppError } from '@/middleware/errorHandler';
import { PaginationParams, PaginatedResponse } from '@/types';
import { fetchUrlMetadata } from '@/utils/metadata';

// tipos locales 
interface CreateBookmarkInput {
    title: string;
    url: string;
    description?: string;
    folderId?: string;
    tagNames?: string[];
}

interface UpdateBookmarkInput {
    title?: string;
    url?: string;
    description?: string;
    folderId?: string | null; // null = quitar de carpeta
    tagNames?: string[];
}

interface ListBookmarksParams extends PaginationParams {
    search?: string;
    folderId?: string;
    tagName?: string;
    favoritesOnly?: boolean;
}

// helper para validar URL 
const validateUrl = (url: string): void => {
    try {
        const parsed = new URL(url);
        // solo permite http y https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new AppError('El URL tiene que tener http o https al principio.', 400);
        }
    } catch (e) {
        if (e instanceof AppError) throw e;
        throw new AppError('URL Invalido', 400);
    }
};

// helper para resolver tags (crear si no existen)
// dado un array de nombre de tags, devuelve los ids, crea los tags que no existan todavia
const resolveTagIds = async (
    tagNames: string[],
    userId: string
): Promise<string[]> => {
    const normalized = tagNames
        .map(t => t.toLowerCase().trim())
        .filter(t => t.length > 0);

    const ids: string[] = [];

    for (const name of normalized) {
        const tag = await prisma.tag.upsert({
            where: {
                name_userId: { name, userId },  // unico por usuario
            },
            update: {},
            create: { name, color: '#60a5fa', userId },
        });
        ids.push(tag.id);
    }

    return ids;
};

// helper: include estandar para queries de bookmarks
// centraliza que relaciones se incluyen siempre
const bookmarkInclude = {
    folder: {
        select: { id: true, name: true },
    },
    tags: {
        include: {
            tag: {
                select: { id: true, name: true, color: true },
            },
        },
    },
} as const;

export const listBookmarks = async (
    userId: string,
    params: ListBookmarksParams
): Promise<PaginatedResponse<unknown>> => {
    const { page = 1, limit = 20, search, folderId, tagName, favoritesOnly } = params;
    const skip = (page - 1) * limit;

    const where = {
        userId,
        // filtro por carpeta (si se pasa "root", buscar sin carpeta)
        ...(folderId === 'root'
            ? { folderId: null }
            : folderId
            ? { folderId }
            : {}),
        // filtro por tag
        ...(tagName
            ? { tags: { some: { tag: { name: tagName.toLowerCase() } } } }
            : {}),
        ...(favoritesOnly ? { isFavorite: true } : {}),
        // busqueda en titulo, url y descripcion
        ...(search
            ? {
                OR: [
                    { title: { contains: search } },
                    { url: { contains: search } },
                    { description: { contains: search } },
                ],
                }
        : {}),
    };

    // ejecuta count y query en paralelo para mejor rendimiento
    const [total, items] = await Promise.all([
        prisma.bookmark.count({ where }),
        prisma.bookmark.findMany({
            where,
            include: bookmarkInclude,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
    ]);

    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

export const getBookmarkById = async (
    id: string,
    userId: string
) => {
    const bookmark = await prisma.bookmark.findFirst({
        where: { id, userId }, // solo el dueño puede verlo
        include: bookmarkInclude,
    });

    if (!bookmark) {
        throw new AppError('No se encontro el marcador.', 404);
    }

    return bookmark;
};

export const createBookmark = async (
    userId: string,
    input: CreateBookmarkInput
) => {
    const { title, url, description, folderId, tagNames = [] } = input;

    validateUrl(url);

    if (folderId) {
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
        });
        if (!folder) throw new AppError('Folder not found', 404);
    }

    // obtiene metadata en paralelo con la resolucion de tags
    const [tagIds, metadata] = await Promise.all([
        resolveTagIds(tagNames, userId),
        fetchUrlMetadata(url),
    ]);

    const bookmark = await prisma.bookmark.create({
        data: {
            title: title || metadata.title || new URL(url).hostname,
            url,
            description: description || metadata.description || null,
            userId,
            folderId: folderId || null,
            faviconUrl: metadata.faviconUrl || null,
            imageUrl: metadata.imageUrl || null,
            tags: {
                create: tagIds.map(tagId => ({ tagId })),
            },
        },
        include: bookmarkInclude,
    });

    return bookmark;
};

export const updateBookmark = async (
    id: string,
    userId: string,
    input: UpdateBookmarkInput
) => {
    // verifica existencia y dueño
    const existing = await prisma.bookmark.findFirst({
        where: { id, userId },
    });

    if (!existing) {
        throw new AppError('No se encontro el marcador.', 404);
    }

    const { title, url, description, folderId, tagNames } = input;

    if (url) validateUrl(url);

    // verifica dueño de la nueva carpeta
    if (folderId) {
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
        });
        if (!folder) {
            throw new AppError('No se encontro la carpeta.', 404);
        }
    }

    // si se pasan tagNames, reemplaza todos los tags del bookmark
    let tagsUpdate = {};
    if (tagNames !== undefined) {
        const tagIds = await resolveTagIds(tagNames, userId);
        tagsUpdate = {
            tags: {
                // borra todos los tags actuales y crea los nuevos
                deleteMany: {},
                create: tagIds.map(tagId => ({ tagId })),
            },
        };
    }

    const bookmark = await prisma.bookmark.update({
        where: { id },
        data: {
            ...(title && { title }),
            ...(url && { url }),
            // description puede ser string vacio para borrarla
            ...(description !== undefined && { description }),
            // folderId puede ser null para quitar de carpeta
            ...(folderId !== undefined && { folderId }),
            ...tagsUpdate,
        },
        include: bookmarkInclude,
    });

    return bookmark;
};

export const deleteBookmark = async (
    id: string,
    userId: string
): Promise<void> => {
    const existing = await prisma.bookmark.findFirst({
        where: { id, userId },
    });

    if (!existing) {
        throw new AppError('No se encontro el marcador.', 404);
    }

    await prisma.bookmark.delete({ where: { id } });
};

export const toggleFav = async (bookmarkId: string, userId: string) => {
    const existing = await prisma.bookmark.findFirst({
        where: { id: bookmarkId, userId },
    });

    if (!existing) {
        return { success: false, error: 'Marcador no encontrado', statusCode: 404 };
    }

    const bookmark = await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { isFavorite: !existing.isFavorite },
        include: bookmarkInclude,
    });

    const message = bookmark.isFavorite ? 'Agregado a favoritos' : 'Quitado de favoritos';
    
    return { 
        success: true, 
        data: { bookmark }, 
        message,
        statusCode: 200 
    };
};

export const refreshBookmarkMetadata = async (
    id: string,
    userId: string
) => {
    const existing = await prisma.bookmark.findFirst({
        where: { id, userId },
    });

    if (!existing) {
        throw new AppError('Marcador no encontrado', 404);
    }

    const metadata = await fetchUrlMetadata(existing.url);

    return prisma.bookmark.update({
        where: { id },
        data: {
            faviconUrl: metadata.faviconUrl ?? undefined,
            imageUrl: metadata.imageUrl ?? undefined,
        },
        include: bookmarkInclude,
    });
};