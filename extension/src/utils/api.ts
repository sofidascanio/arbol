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

// endpoints 
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

    deleteBookmarkByUrl: async (url: string): Promise<void> => {
        // busca el marcador por url y lo elimina
        const data = await request<{ items: Bookmark[] }>(
            `/bookmarks?search=${encodeURIComponent(url)}&limit=5`
        );
        const match = data.items.find(b => b.url === url);
        if (match) {
            await request(`/bookmarks/${match.id}`, { method: 'DELETE' });
        }
    },
};