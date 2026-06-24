import { ApiResponse } from '@/types';

const BASE_URL = '/api';

class ApiError extends Error {
    constructor(
        public message: string,
        public status: number,
        public errors?: string[]
    ) {
        super(message);
    }
}

const getToken = (): string | null => {
    return localStorage.getItem('token');
};

const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
        throw new ApiError(
            json.message || 'Error en el servidor',
            response.status,
            json.errors
        );
    }

    return json.data as T;
};

// metodos http 
export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint),

    post: <T>(endpoint: string, body: unknown) =>
        request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    put: <T>(endpoint: string, body: unknown) =>
        request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    delete: <T>(endpoint: string) =>
        request<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };