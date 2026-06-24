import { useState, useEffect, useCallback } from 'react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { BookmarkCard } from '../../components/BookmarkCard/BookmarkCard';
import { cn } from '@/utils/cn';
import styles from './GalleryView.module.css';

interface GalleryViewProps {
    searchQuery: string;
    activeFolderId?: string;
    onAddNew: () => void;
}

const QUICK_FILTERS = [
    { label: 'Todos', value: '' },
    { label: 'Diseño', value: 'design' },
    { label: 'Ingeniería', value: 'engineering' },
    { label: 'Inspiración', value: 'inspiration' },
    { label: 'Recursos', value: 'resources' },
];

export const GalleryView = ({
    searchQuery,
    activeFolderId,
    onAddNew,
}: GalleryViewProps) => {
    const [activeTag, setActiveTag] = useState('');
    const { bookmarks, total, isLoading, fetchBookmarks, deleteBookmark } = useBookmarks();

    // re-fetch cuando cambian los filtros
    useEffect(() => {
        fetchBookmarks({
            search: searchQuery || undefined,
            folderId: activeFolderId,
            tag: activeTag || undefined,
        });
    }, [searchQuery, activeFolderId, activeTag]); 

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('¿Eliminar este marcador?')) return;
        try {
            await deleteBookmark(id);
        } catch {
            alert('No se pudo eliminar el marcador');
        }
    }, [deleteBookmark]);

    return (
        <div className={styles.container}>
            {/* encabezado  */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>
                        {activeFolderId ? 'Carpeta' : 'Todos los marcadores'}
                    </h1>
                </div>
                <p className={styles.subtitle}>
                    {total} {total === 1 ? 'referencia guardada' : 'referencias guardadas'} en tu archivo.
                </p>
            </div>

            {/* filtros rápidos  */}
            <div className={styles.filters}>
                <span className={styles.filterLabel}>Filtrar por:</span>
                {QUICK_FILTERS.map(f => (
                    <button key={f.value}
                            className={cn(
                            styles.filterChip,
                            activeTag === f.value && styles.filterChipActive
                            )}
                            onClick={() => setActiveTag(f.value)}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* grilla  */}
            {isLoading ? (
                <div className={styles.loading}>
                    <span className="material-symbols-outlined"
                        style={{ animation: 'spin 1s linear infinite', fontSize: 24 }}>
                        progress_activity
                    </span>
                    Cargando...
                </div>
            ) : (
                <div className={styles.grid}>
                    {bookmarks.length === 0 && (
                        <div className={styles.empty}>
                            <p className={styles.emptyTitle}>Sin resultados</p>
                            <p>Probá con otro filtro o agregá un nuevo marcador.</p>
                        </div>
                    )}

                    {bookmarks.map(bookmark => (
                        <BookmarkCard key={bookmark.id}
                                    bookmark={bookmark}
                                    onDelete={handleDelete}
                        />
                    ))}

                    {/* tarjeta para agregar nuevo */}
                    <button className={styles.addCard} onClick={onAddNew}>
                        <div className={styles.addCardIcon}>
                            <span className="material-symbols-outlined">add_link</span>
                        </div>
                        <span className={styles.addCardLabel}>Agregar marcador</span>
                        <span className={styles.addCardSub}>
                            Pega un enlace o agregalo manualmente
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};