import { storage } from './storage';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

export class ExtApiError extends Error {
    constructor(
        public message: string,
        public status: number
    ) {
        super(message);
    }
}

const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const [token, apiUrl] = await Promise.all([
        storage.getToken(),
        storage.getApiUrl(),
    ]);

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
    });

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
        throw new ExtApiError(
            json.message ?? 'Error en el servidor',
            response.status
        );
    }

    return json.data as T;
};

// Tipos 
interface LoginResult {
    token: string;
    user: { id: string; email: string; createdAt: string };
}

interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    children: Folder[];
}

interface Bookmark {
    id: string;
    title: string;
    url: string;
}

export interface BookmarkFull {
    id: string;
    title: string;
    url: string;
    folderId: string | null;
    folder: { id: string; name: string } | null;
    tags: { tag: { id: string; name: string; color: string } }[];
    isFavorite: boolean;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    bookmarkCount: number;
}

// API 
export const extApi = {
    login: (email: string, password: string) =>
        request<LoginResult>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    me: () =>
        request<{ user: { id: string; email: string } }>('/auth/me'),

    getFolders: () =>
        request<{ folders: Folder[] }>('/folders'),

    getTags: () =>
        request<{ tags: Tag[] }>('/tags'),

    createBookmark: (data: {
        title: string;
        url: string;
        description?: string;
        folderId?: string;
        tagNames?: string[];
    }) =>
        request<{ bookmark: Bookmark }>('/bookmarks', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateBookmark: (id: string, data: {
        title?: string;
        folderId?: string | null;
        tagNames?: string[];
    }) =>
        request<{ bookmark: BookmarkFull }>(`/bookmarks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // busca el marcador por URL exacta, devuelve null si no existe
    getBookmarkByUrl: async (url: string): Promise<BookmarkFull | null> => {
        const data = await request<{ items: BookmarkFull[] }>(
            `/bookmarks?search=${encodeURIComponent(url)}&limit=10`
        );
        return data.items.find(b => b.url === url) ?? null;
    },

    deleteBookmarkByUrl: async (url: string): Promise<void> => {
        const data = await request<{ items: Bookmark[] }>(
            `/bookmarks?search=${encodeURIComponent(url)}&limit=5`
        );
        const match = data.items.find(b => b.url === url);
        if (match) {
            await request(`/bookmarks/${match.id}`, { method: 'DELETE' });
        }
    },
};