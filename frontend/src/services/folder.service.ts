import { api } from '@/services/api';
import { Folder } from '@/types';

export interface CreateFolderInput {
    name: string;
    parentId?: string;
}

export const folderService = {
    getTree: () => api.get<{ folders: Folder[] }>('/folders'),
    getById: (id: string) => api.get<{ folder: Folder }>(`/folders/${id}`),
    getBreadcrumb: (id: string) => api.get<{ breadcrumb: { id: string; name: string }[] }>(`/folders/${id}/breadcrumb`),
    create: (input: CreateFolderInput) => api.post<{ folder: Folder }>('/folders', input),
    update: (id: string, input: { name?: string; parentId?: string | null }) =>  api.put<{ folder: Folder }>(`/folders/${id}`, input),
    delete: (id: string) => api.delete<{ deletedFolders: number }>(`/folders/${id}`),
};