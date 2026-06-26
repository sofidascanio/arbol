import { useState, useEffect, useCallback } from 'react';
import { tagService, Tag } from '@/services/tag.service';

interface UseTagsReturn {
    tags: Tag[];
    isLoading: boolean;
    error: string | null;
    fetchTags: () => Promise<void>;
    addTagToBookmark: (bookmarkId: string, tagNames: string[]) => Promise<void>;
    removeTagFromBookmark: (bookmarkId: string, tagName: string) => Promise<void>;
}

export const useTags = (): UseTagsReturn => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTags = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await tagService.list();
            setTags(data.tags);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar etiquetas');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const addTagToBookmark = useCallback(
        async (bookmarkId: string, tagNames: string[]) => {
            await tagService.addToBookmark(bookmarkId, tagNames);
            await fetchTags(); // refrescar conteos
        },
        [fetchTags]
    );

    const removeTagFromBookmark = useCallback(
        async (bookmarkId: string, tagName: string) => {
            await tagService.removeFromBookmark(bookmarkId, tagName);
            await fetchTags(); // refrescar conteos
        },
        [fetchTags]
    );

    return {
        tags,
        isLoading,
        error,
        fetchTags,
        addTagToBookmark,
        removeTagFromBookmark,
    };
};