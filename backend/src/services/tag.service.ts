import { prisma } from '@/utils/prisma';
import { AppError } from '@/middleware/errorHandler';

interface TagWithCount {
    id: string;
    name: string;
    color: string;
    bookmarkCount: number;
}

// listar todos los tags del usuario 
export const listUserTags = async (userId: string): Promise<TagWithCount[]> => {
    const tags = await prisma.tag.findMany({
        where: { userId },
        include: {
            bookmarks: true,
        },
        orderBy: { name: 'asc' },
    });

    return tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        bookmarkCount: tag.bookmarks.length,
    }));
};

// tags mas usados 
export const getPopularTags = async (
    userId: string,
    limit = 10
): Promise<TagWithCount[]> => {
    const tags = await prisma.tag.findMany({
        where: { userId },
        include: { bookmarks: true },
    });

    return tags
        .map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            bookmarkCount: tag.bookmarks.length,
        }))
        .sort((a, b) => b.bookmarkCount - a.bookmarkCount)
        .slice(0, limit);
};

// crear tag 
export const createTag = async (
    userId: string,
    name: string,
    color: string
): Promise<{ id: string; name: string; color: string }> => {
    const normalized = name.toLowerCase().trim();

    // Verificar que no exista ya para este usuario
    const existing = await prisma.tag.findUnique({
        where: {
            name_userId: { name: normalized, userId },
        },
    });

    if (existing) {
        // Si ya existe, solo actualizar el color
        return prisma.tag.update({
            where: { id: existing.id },
            data: { color },
            select: { id: true, name: true, color: true },
        });
    }

    return prisma.tag.create({
        data: { name: normalized, color, userId },
        select: { id: true, name: true, color: true },
    });
};

// actualizar color 
export const updateTagColor = async (
    tagId: string,
    userId: string,
    color: string
): Promise<{ id: string; name: string; color: string }> => {
    const tag = await prisma.tag.findFirst({
        where: { id: tagId, userId },
    });

    if (!tag) throw new AppError('Etiqueta no encontrada', 404);

    return prisma.tag.update({
        where: { id: tagId },
        data: { color },
        select: { id: true, name: true, color: true },
    });
};

// eliminar tag 
export const deleteTag = async (
    tagId: string,
    userId: string
): Promise<void> => {
    const tag = await prisma.tag.findFirst({
        where: { id: tagId, userId },
    });

    if (!tag) throw new AppError('Etiqueta no encontrada', 404);

    // prisma elimina BookmarkTag en cascade por onDelete: Cascade en BookmarkTag
    await prisma.tag.delete({ where: { id: tagId } });
};

// tags de un bookmark 
export const getBookmarkTags = async (
    bookmarkId: string,
    userId: string
): Promise<{ id: string; name: string; color: string }[]> => {
    const bookmark = await prisma.bookmark.findFirst({
        where: { id: bookmarkId, userId },
        include: {
            tags: {
                include: {
                tag: { select: { id: true, name: true, color: true } },
                },
            },
        },
    });

    if (!bookmark) throw new AppError('Marcador no encontrado', 404);

    return bookmark.tags.map(bt => bt.tag);
};

// agregar tags a un bookmark 
export const addTagsToBookmark = async (
    bookmarkId: string,
    userId: string,
    tagNames: string[]
): Promise<void> => {
    const bookmark = await prisma.bookmark.findFirst({
        where: { id: bookmarkId, userId },
        include: {
            tags: { include: { tag: true } },
        },
    });

    if (!bookmark) throw new AppError('Marcador no encontrado', 404);

    const existingTagNames = bookmark.tags.map(bt => bt.tag.name);
    const toAdd = tagNames
        .map(t => t.toLowerCase().trim())
        .filter(name => name && !existingTagNames.includes(name));

    for (const name of toAdd) {
        // busca o crea el tag del usuario
        const tag = await prisma.tag.upsert({
            where: { name_userId: { name, userId } },
            update: {},
            create: { name, color: '#60a5fa', userId },
        });

        await prisma.bookmarkTag.create({
            data: { bookmarkId, tagId: tag.id },
        });
    }
};

// remover tag de un bookmark 
export const removeTagFromBookmark = async (
    bookmarkId: string,
    userId: string,
    tagName: string
): Promise<void> => {
    const bookmark = await prisma.bookmark.findFirst({
        where: { id: bookmarkId, userId },
    });

    if (!bookmark) throw new AppError('Marcador no encontrado', 404);

    const tag = await prisma.tag.findUnique({
        where: { name_userId: { name: tagName.toLowerCase().trim(), userId } },
    });

    if (!tag) throw new AppError('Etiqueta no encontrada', 404);

    const relation = await prisma.bookmarkTag.findUnique({
        where: { bookmarkId_tagId: { bookmarkId, tagId: tag.id } },
    });

    if (!relation) throw new AppError('El marcador no tiene esa etiqueta', 404);

    await prisma.bookmarkTag.delete({
        where: { bookmarkId_tagId: { bookmarkId, tagId: tag.id } },
    });
};

export const renameTag = async (
    tagId: string,
    userId: string,
    newName: string
): Promise<{ id: string; name: string; color: string }> => {
    const tag = await prisma.tag.findFirst({ where: { id: tagId, userId } });
    if (!tag) throw new AppError('Etiqueta no encontrada', 404);

    const normalized = newName.toLowerCase().trim();

    // verifica que no choque con otro tag del mismo usuario
    const existing = await prisma.tag.findUnique({
        where: { name_userId: { name: normalized, userId } },
    });
    if (existing && existing.id !== tagId) {
        throw new AppError('Ya tenés una etiqueta con ese nombre', 409);
    }

    return prisma.tag.update({
        where: { id: tagId },
        data: { name: normalized },
        select: { id: true, name: true, color: true },
    });
};
