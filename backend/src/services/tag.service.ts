import { prisma } from '@/utils/prisma';
import { AppError } from '@/middleware/errorHandler';

interface TagWithCount {
    id: string;
    name: string;
    bookmarkCount: number;
}

// listar todos los tags que usa el usuario (con conteo de marcadores)
export const listUserTags = async (userId: string): Promise<TagWithCount[]> => {
    // busca tags que tengan al menos un bookmark del usuario
    const tags = await prisma.tag.findMany({
        where: {
            bookmarks: {
                some: {
                    bookmark: { userId },
                },
            },
        },
        include: {
            bookmarks: {
                where: {
                    bookmark: { userId },
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        bookmarkCount: tag.bookmarks.length,
    }));
};

// tags mas usados por el usuario (para sugerencias)
export const getPopularTags = async (
    userId: string,
    limit = 10
): Promise<TagWithCount[]> => {
    const tags = await prisma.tag.findMany({
        where: {
        bookmarks: {
            some: {
                bookmark: { userId },
            },
        },
        },
        include: {
            bookmarks: {
                where: {
                    bookmark: { userId },
                },
            },
        },
    });

    return tags
        .map(tag => ({
            id: tag.id,
            name: tag.name,
            bookmarkCount: tag.bookmarks.length,
        }))
        .sort((a, b) => b.bookmarkCount - a.bookmarkCount)
        .slice(0, limit);
};

// agrega tags a un marcador existente
export const addTagsToBookmark = async (
    bookmarkId: string,
    userId: string,
    tagNames: string[]
): Promise<void> => {
    // verifica que el bookmark pertenece al usuario
    const bookmark = await prisma.bookmark.findFirst({
        where: { id: bookmarkId, userId },
        include: { tags: { include: { tag: true } } },
    });

    if (!bookmark) {
        throw new AppError('Marcador no encontrado', 404);
    }

    const normalized = tagNames
        .map(t => t.toLowerCase().trim())
        .filter(t => t.length > 0);

    // tags que ya tiene el bookmark
    const existingTagNames = bookmark.tags.map(bt => bt.tag.name);

    // solo agregar los que no tiene todavía
    const toAdd = normalized.filter(name => !existingTagNames.includes(name));

    for (const name of toAdd) {
        const tag = await prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
        });

        await prisma.bookmarkTag.create({
            data: {
                bookmarkId,
                tagId: tag.id,
            },
        });
    }
};

// borrar un tag especifico de un marcador
export const removeTagFromBookmark = async (
    bookmarkId: string,
    userId: string,
    tagName: string
): Promise<void> => {
    // verifica dueño del marcador
    const bookmark = await prisma.bookmark.findFirst({
        where: { id: bookmarkId, userId },
    });

    if (!bookmark) {
        throw new AppError('Marcador no encontrado', 404);
    }

    const tag = await prisma.tag.findUnique({
        where: { name: tagName.toLowerCase().trim() },
    });

    if (!tag) {
        throw new AppError('Etiqueta no encontrada', 404);
    }

    const relation = await prisma.bookmarkTag.findUnique({
        where: {
            bookmarkId_tagId: {
                bookmarkId,
                tagId: tag.id,
            },
        },
    });

    if (!relation) {
        throw new AppError('El marcador no tiene esa etiqueta', 404);
    }

    await prisma.bookmarkTag.delete({
        where: {
            bookmarkId_tagId: {
                bookmarkId,
                tagId: tag.id,
            },
        },
    });

    // limpia tag huerfano, si ningun marcador usa este tag, se elimina
    const usageCount = await prisma.bookmarkTag.count({
        where: { tagId: tag.id },
    });

    if (usageCount === 0) {
        await prisma.tag.delete({ where: { id: tag.id } });
    }
};

// obtiene todos los tags de un marcador especifico
export const getBookmarkTags = async (
    bookmarkId: string,
    userId: string
): Promise<{ id: string; name: string }[]> => {
    const bookmark = await prisma.bookmark.findFirst({
        where: { id: bookmarkId, userId },
        include: {
            tags: {
                include: {
                    tag: { select: { id: true, name: true } },
                },
            },
        },
    });

    if (!bookmark) {
        throw new AppError('Marcador no encontrado', 404);
    }

    return bookmark.tags.map(bt => bt.tag);
};