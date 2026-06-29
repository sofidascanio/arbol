// entidades 
export interface User {
    id: string;
    email: string;
    createdAt: string;
}

export interface Tag {
    id: string;
    name: string;
}

export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
    children: Folder[];
    _count: { bookmarks: number };
}

export interface Bookmark {
    id: string;
    title: string;
    url: string;
    description: string | null;
    isFavorite: boolean;
    faviconUrl: string | null; 
    imageUrl: string | null;
    folderId: string | null;
    folder: { id: string; name: string } | null;
    tags: { tag: Tag }[];
    createdAt: string;
    updatedAt: string;
}

// API 
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// auth 
export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    email: string;
    password: string;
}

// tema 
export type Theme = 'light' | 'dark';