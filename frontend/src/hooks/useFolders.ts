import { useState, useEffect, useCallback } from 'react';
import { Folder } from '@/types';
import { folderService, CreateFolderInput } from '@/services/folder.service';

interface UseFoldersReturn {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  createFolder: (input: CreateFolderInput) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useFolders = (): UseFoldersReturn => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFolders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await folderService.getTree();
            setFolders(data.folders);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar carpetas');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    const createFolder = async (input: CreateFolderInput): Promise<Folder> => {
        const data = await folderService.create(input);
        await fetchFolders();
        return data.folder;
    };

    const deleteFolder = async (id: string): Promise<void> => {
        await folderService.delete(id);
        await fetchFolders();
    };

    return { folders, isLoading, error, fetchFolders, createFolder, deleteFolder };
};