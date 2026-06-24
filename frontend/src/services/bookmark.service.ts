import { api } from '@/services/api';
import { Bookmark, PaginatedResponse } from '@/types';

export interface ListBookmarksParams {
    page?: number;
    limit?: number;
    search?: string;
    folderId?: string;
    tag?: string;
}

export interface CreateBookmarkInput {
    title: string;
    url: string;
    description?: string;
    folderId?: string;
    tagNames?: string[];
}

export interface UpdateBookmarkInput {
    title?: string;
    url?: string;
    description?: string;
    folderId?: string | null;
    tagNames?: string[];
}

export const bookmarkService = {
    list: (params: ListBookmarksParams = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.limit) query.set('limit', String(params.limit));
        if (params.search) query.set('search', params.search);
        if (params.folderId) query.set('folderId', params.folderId);
        if (params.tag) query.set('tag', params.tag);
        return api.get<{ items: Bookmark[]; total: number; page: number; limit: number; totalPages: number }>(
            `/bookmarks?${query.toString()}`
        );
    },
    getById: (id: string) => api.get<{ bookmark: Bookmark }>(`/bookmarks/${id}`),
    create: (input: CreateBookmarkInput) => api.post<{ bookmark: Bookmark }>('/bookmarks', input),
    update: (id: string, input: UpdateBookmarkInput) => api.put<{ bookmark: Bookmark }>(`/bookmarks/${id}`, input),
    delete: (id: string) => api.delete<null>(`/bookmarks/${id}`),
};