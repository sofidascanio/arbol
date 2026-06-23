import { prisma } from '@/utils/prisma';
import { AppError } from '@/middleware/errorHandler';

interface CreateFolderInput {
    name: string;
    parentId?: string;
}

interface UpdateFolderInput {
    name?: string;
    parentId?: string | null; // null = mover a raiz
}

// tipo recursivo para el arbol de carpetas
interface FolderNode {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    children: FolderNode[];
    _count: { bookmarks: number };
}

// helper para construir arbol desde lista plana 
const buildTree = (folders: FolderNode[], parentId: string | null = null): FolderNode[] => {
  return folders
    .filter(f => f.parentId === parentId)
    .map(f => ({
      ...f,
      children: buildTree(folders, f.id),
    }));
};

// datos de carpeta
const getFolderData = async (id: string, userId: string) => {
    return await prisma.folder.findFirst({
        where: { id, userId },
        select: { id: true, name: true, parentId: true },
    });
};

// obtiene todos los id descendientes de una carpeta
const getDescendantIds = async (
    folderId: string,
    userId: string
): Promise<string[]> => {
    // obtiene todas las carpetas del usuario de una vez
    const allFolders = await prisma.folder.findMany({
        where: { userId },
        select: { id: true, parentId: true },
    });

    const descendants: string[] = [];
    const queue = [folderId];

    while (queue.length > 0) {
        const current = queue.shift()!;
        const children = allFolders.filter(f => f.parentId === current);

        for (const child of children) {
            descendants.push(child.id);
            queue.push(child.id);
        }
    }

    return descendants;
};

export const getFolderTree = async (userId: string): Promise<FolderNode[]> => {
    // una sola query para todas las carpetas del usuario
    const folders = await prisma.folder.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
            children: false,
            _count: {
                select: { bookmarks: true }, // cuantos marcadores tiene cada carpeta
            },
        },
        orderBy: { name: 'asc' },
    }) as unknown as FolderNode[];

    return buildTree(folders);
};

export const getFolderById = async (
    id: string,
    userId: string
) => {
    const folder = await prisma.folder.findFirst({
        where: { id, userId },
        include: {
        parent: {
            select: { id: true, name: true },
        },
        _count: {
            select: { bookmarks: true, children: true },
        },
        },
    });

    if (!folder) {
        throw new AppError('No se encontro la carpeta raíz.', 404);
    }

    return folder;
};

export const createFolder = async (
    userId: string,
    input: CreateFolderInput
) => {
    const { name, parentId } = input;

    // si se especifica parentId, verifica que la carpeta padre pertenece al usuario
    if (parentId) {
        const parent = await prisma.folder.findFirst({
            where: { id: parentId, userId },
        });

        if (!parent) {
            throw new AppError('No se encontro la carpeta raíz.', 404);
        }
    }

    const folder = await prisma.folder.create({
        data: {
            name,
            userId,
            parentId: parentId || null,
        },
        include: {
            parent: {
                select: { id: true, name: true },
            },
            _count: {
                select: { bookmarks: true, children: true },
            },
        },
    });

    return folder;
};

export const updateFolder = async (
    id: string,
    userId: string,
    input: UpdateFolderInput
) => {
    // verifica existencia y dueño
    const existing = await prisma.folder.findFirst({
        where: { id, userId },
    });

    if (!existing) {
        throw new AppError('No se encontro la carpeta.', 404);
    }

    const { name, parentId } = input;

    // valida el nuevo parentId si se esta moviendo la carpeta
    if (parentId !== undefined && parentId !== null) {
        // no puede ser su propio padre
        if (parentId === id) {
            throw new AppError('Una carpeta no puede estar incluida dentro de si misma.', 400);
        }

        // verifica que el nuevo padre pertenece al usuario
        const newParent = await prisma.folder.findFirst({
            where: { id: parentId, userId },
        });

        if (!newParent) {
            throw new AppError('No se encontro la carpeta raíz.', 404);
        }

        // verifica que el nuevo padre no es un descendiente de la carpeta actual
        // evita ciclos: A → B → C → A
        const descendants = await getDescendantIds(id, userId);
            if (descendants.includes(parentId)) {
            throw new AppError('No se puede mover una carpeta adentro de una de sus sub-carpetas.', 400);
        }
    }

    const folder = await prisma.folder.update({
        where: { id },
        data: {
            ...(name && { name }),
            // parentId puede ser null (mover a raíz) o un string (mover a otra carpeta)
            ...(parentId !== undefined && { parentId }),
        },
        include: {
            parent: {
                select: { id: true, name: true },
            },
            _count: {
                select: { bookmarks: true, children: true },
            },
        },
    });

    return folder;
};

export const deleteFolder = async (
    id: string,
    userId: string
): Promise<{ deletedFolders: number }> => {
    const existing = await prisma.folder.findFirst({
        where: { id, userId },
    });

    if (!existing) {
        throw new AppError('No se encontro la carpeta.', 404);
    }

    // obtiene todos los id de subcarpetas para el conteo
    const descendantIds = await getDescendantIds(id, userId);
    const allIds = [id, ...descendantIds];

    // los bookmarks dentro de esas carpetas quedan con folderId = null (SetNull)
    // las subcarpetas se eliminan por cascade
    await prisma.folder.delete({ where: { id } });

    return { deletedFolders: allIds.length };
};

export const getBreadcrumb = async (
    folderId: string,
    userId: string
): Promise<{ id: string; name: string }[]> => {
    const breadcrumb: { id: string; name: string }[] = [];
    let currentId: string | null = folderId;

    // subir por el arbol hasta llegar a la raiz
    while (currentId) {
        const folder = await getFolderData(currentId, userId);
        if (!folder) break;
        breadcrumb.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
    }

    return breadcrumb;
};