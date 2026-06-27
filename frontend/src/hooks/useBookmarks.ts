import { useState, useCallback } from 'react';
import { Bookmark } from '@/types';
import {
    bookmarkService,
    ListBookmarksParams,
    CreateBookmarkInput,
    UpdateBookmarkInput,
} from '@/services/bookmark.service';

interface UseBookmarksReturn {
    bookmarks: Bookmark[];
    total: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    fetchBookmarks: (params?: ListBookmarksParams) => Promise<void>;
    createBookmark: (input: CreateBookmarkInput) => Promise<Bookmark>;
    updateBookmark: (id: string, input: UpdateBookmarkInput) => Promise<Bookmark>;
    deleteBookmark: (id: string) => Promise<void>;
    handleFavoriteToggle: (id: string, isFavorite: boolean) => void;
}

export const useBookmarks = (): UseBookmarksReturn => {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // sin useEffect, cada vista llama fetchBookmarks cuando quiere y con los params que quiere
    const fetchBookmarks = useCallback(async (params: ListBookmarksParams = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await bookmarkService.list(params);
            setBookmarks(data.items);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar marcadores');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
        const data = await bookmarkService.create(input);
        await fetchBookmarks();
        return data.bookmark;
    };

    const updateBookmark = async (id: string, input: UpdateBookmarkInput): Promise<Bookmark> => {
        const data = await bookmarkService.update(id, input);
        setBookmarks(prev => prev.map(b => (b.id === id ? data.bookmark : b)));
        return data.bookmark;
    };

    const deleteBookmark = async (id: string): Promise<void> => {
        await bookmarkService.delete(id);
        setBookmarks(prev => prev.filter(b => b.id !== id));
        setTotal(prev => prev - 1);
    };

    const handleFavoriteToggle = (id: string, isFavorite: boolean) => {
        setBookmarks(prev =>
            prev.map(b => (b.id === id ? { ...b, isFavorite } : b))
        );
    };

    return {
        bookmarks,
        total,
        totalPages,
        isLoading,
        error,
        fetchBookmarks,
        createBookmark,
        updateBookmark,
        deleteBookmark,
        handleFavoriteToggle,
    };
};