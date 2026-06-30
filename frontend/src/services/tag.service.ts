import { api } from '@/services/api';

export interface Tag {
    id: string;
    name: string;
    color: string;
    bookmarkCount: number;
}

export const tagService = {
    list: () => api.get<{ tags: Tag[] }>('/tags'),
    popular: (limit = 10) => api.get<{ tags: Tag[] }>(`/tags/popular?limit=${limit}`),
    getBookmarkTags: (bookmarkId: string) => api.get<{ tags: { id: string; name: string }[] }>(`/tags/bookmark/${bookmarkId}`),
    addToBookmark: (bookmarkId: string, tagNames: string[]) => api.post<null>(`/tags/bookmark/${bookmarkId}`, { tagNames }),
    removeFromBookmark: (bookmarkId: string, tagName: string) => api.delete<null>(`/tags/bookmark/${bookmarkId}/${tagName}`),
    updateColor: (tagId: string, color: string) =>
        api.patch<{ tag: { id: string; name: string; color: string } }>( 
            `/tags/${tagId}/color`, { color }
        ),
    createTag: (name: string, color: string) => api.post<{ tag: { id: string; name: string; color: string } }>('/tags', {name, color, }),
    deleteTag: (tagId: string) => api.delete<null>(`/tags/${tagId}`),
    renameTag: (tagId: string, name: string) =>
        api.patch<{ tag: { id: string; name: string; color: string } }>(`/tags/${tagId}/name`, { name }),
};