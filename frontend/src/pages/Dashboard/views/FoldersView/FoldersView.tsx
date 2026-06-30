import { useEffect, useState, useMemo, useCallback } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Folder, Bookmark } from '@/types';
import { BookmarkCard } from '../../components/BookmarkCard/BookmarkCard';
import { InputModal } from '@/components/ui/InputModal/InputModal';
import { cn } from '@/utils/cn';
import { folderService } from '@/services/folder.service';
import { useToastContext } from '@/context/ToastContext';
import styles from './FoldersView.module.css';

interface FoldersViewProps {
    searchQuery: string;
    onAddNew: () => void;
    onEdit?: (bookmark: Bookmark) => void;
}

export const FoldersView = ({ searchQuery, onAddNew, onEdit }: FoldersViewProps) => {
    const { folders, isLoading: foldersLoading, createFolder, fetchFolders } = useFolders();
    const { bookmarks, isLoading: bookmarksLoading, fetchBookmarks, deleteBookmark, handleFavoriteToggle } = useBookmarks();

    const [activeFilter, setActiveFilter] = useState('');
    const [activeFolderPath, setActiveFolderPath] = useState<Folder[]>([]);

    // estado del modal de nueva subcarpeta
    const [folderModal, setFolderModal] = useState(false);

    const currentFolder = activeFolderPath[activeFolderPath.length - 1];
    const currentFolderChildren = currentFolder?.children ?? folders;

    const toast = useToastContext();

    useEffect(() => {
        fetchBookmarks({
            search: searchQuery || undefined,
            folderId: currentFolder?.id,
            tag: activeFilter || undefined,
        });
        setActiveFilter('');
    }, [searchQuery, currentFolder?.id]);

    // re-fetch al cambiar etiqueta sin resetearla
    useEffect(() => {
        fetchBookmarks({
            search: searchQuery || undefined,
            folderId: currentFolder?.id,
            tag: activeFilter || undefined,
        });
    }, [activeFilter]); 

    // extrae etiquetas unicas de los bookmarks cargados
    const availableTags = useMemo(() => {
        const seen = new Map<string, { name: string; count: number }>();

        for (const bookmark of bookmarks) {
            for (const bt of bookmark.tags) {
                const name = bt.tag.name;
                if (seen.has(name)) {
                    seen.get(name)!.count++;
                } else {
                    seen.set(name, { name, count: 1 });
                }
            }
        }

        return [...seen.values()].sort(
            (a, b) => b.count - a.count || a.name.localeCompare(b.name)
        );
    }, [bookmarks]);

    // filtra bookmarks localmente por etiqueta
    const filteredBookmarks = useMemo(() => {
        if (!activeFilter) return bookmarks;
        return bookmarks.filter(bm =>
            bm.tags.some(bt => bt.tag.name === activeFilter)
        );
    }, [bookmarks, activeFilter]);

    const handleFolderClick = (folder: Folder) => {
        setActiveFolderPath(prev => [...prev, folder]);
    };

    const handleBreadcrumbClick = (index: number) => {
        setActiveFolderPath(prev => prev.slice(0, index + 1));
    };

    const handleRootClick = () => {
        setActiveFolderPath([]);
    };

    const handleCreateSubfolder = async (name: string) => {
        await createFolder({
            name,
            parentId: currentFolder?.id,
        });
        await fetchFolders();
    };

    const handleTagFilter = (tagName: string) => {
        setActiveFilter(prev => (prev === tagName ? '' : tagName));
    };

    const handleDeleteBookmark = useCallback(
        async (id: string) => {
            if (!confirm('¿Eliminar este marcador?')) return;
            try {
                await deleteBookmark(id);
            } catch {
                toast.error('No se pudo eliminar el marcador');
            }
        },
        [deleteBookmark]
    );

    const handleDeleteFolder = async () => {
        if (!currentFolder) return;

        const confirmed = window.confirm(
            `¿Eliminar la carpeta "${currentFolder.name}"?\n\nLos marcadores dentro quedarán sin carpeta.`
        );
        if (!confirmed) return;

        try {
            await folderService.delete(currentFolder.id);
            await fetchFolders();
            // vuelve al nivel anterior en el breadcrumb
            setActiveFolderPath(prev => prev.slice(0, -1));
            toast.success(`Carpeta "${currentFolder.name}" eliminada`);
        } catch {
            toast.error('No se pudo eliminar la carpeta');
        }
    };

    return (
        <div className={styles.container}>
            {/* breadcrumb  */}
            <div className={styles.breadcrumb}>
                <span style={{ cursor: 'pointer' }} onClick={handleRootClick}>
                    Archivo
                </span>
                {activeFolderPath.map((folder, i) => (
                    <>
                        <span
                            key={`sep-${folder.id}`}
                            className={cn('material-symbols-outlined', styles.breadcrumbIcon)}
                        >
                        chevron_right
                        </span>
                        <span
                            key={folder.id}
                            className={
                                i === activeFolderPath.length - 1
                                ? styles.breadcrumbCurrent
                                : ''
                            }
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleBreadcrumbClick(i)}
                        >
                        {folder.name}
                        </span>
                    </>
                ))}
            </div>

            {/* encabezado  */}
            <div className={styles.titleRow}>
                <div>
                    <h1 className={styles.title}>{currentFolder?.name ?? 'Carpetas'}</h1>
                    <p className={styles.subtitle}>
                        {currentFolder
                            ? `Contenido de la carpeta ${currentFolder.name}`
                            : ''}
                    </p>
                </div>

                {/* boton eliminar, solo visible dentro de una carpeta */}
                {currentFolder && (
                    <button
                        className={styles.deleteBtn}
                        onClick={handleDeleteFolder}
                        title="Eliminar carpeta"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            delete
                        </span>
                        Eliminar carpeta
                    </button>
                )}
            </div>

            {/* subcarpetas  */}
            {foldersLoading ? (
                <div className={styles.loading}>
                    <span
                        className="material-symbols-outlined"
                        style={{ animation: 'spin 1s linear infinite' }}
                    >
                        progress_activity
                    </span>
                </div>
            ) : (
                <>
                    <p className={styles.sectionLabel}>
                        {currentFolder ? 'Subcarpetas' : 'Colecciones'}
                    </p>
                    <div className={styles.foldersGrid}>
                        {currentFolderChildren.map(folder => (
                            <button
                                key={folder.id}
                                className={styles.folderCard}
                                onClick={() => handleFolderClick(folder)}
                            >
                                <div className={styles.folderCardHeader}>
                                    <div className={styles.folderIcon}>
                                        <span className="material-symbols-outlined">folder</span>
                                    </div>
                                    <span className={styles.folderCount}>
                                        {folder._count.bookmarks} elementos
                                    </span>
                                </div>
                                <div className={styles.folderName}>{folder.name}</div>
                                <div className={styles.folderSub}>
                                    {folder.children?.length > 0
                                        ? `${folder.children.length} subcarpetas`
                                        : 'Sin subcarpetas'}
                                </div>
                            </button>
                        ))}

                        {/* nueva subcarpeta */}
                        <button
                            className={styles.newFolderCard}
                            onClick={() => setFolderModal(true)}
                        >
                            <div className={styles.newFolderIconWrapper}>
                                <span className="material-symbols-outlined">add</span>
                            </div>
                            <span className={styles.newFolderLabel}>
                                {currentFolder ? 'Nueva subcarpeta' : 'Nueva carpeta'}
                            </span>
                        </button>
                    </div>
                </>
            )}

            {/* filtros por etiqueta */}
            {!bookmarksLoading && availableTags.length > 0 && (
                <div className={styles.filters}>
                    <span className={styles.filterLabel}>Etiquetas:</span>

                    <button
                        className={cn(
                            styles.filterChip,
                            activeFilter === '' && styles.filterChipActive
                        )}
                        onClick={() => setActiveFilter('')}
                    >
                        Todos
                        <span className={styles.filterChipCount}>{bookmarks.length}</span>
                    </button>

                    {availableTags.map(tag => (
                        <button
                            key={tag.name}
                            className={cn(
                                styles.filterChip,
                                activeFilter === tag.name && styles.filterChipActive
                            )}
                            onClick={() => handleTagFilter(tag.name)}
                        >
                            {tag.name}
                            <span className={styles.filterChipCount}>{tag.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* marcadores */}
            {bookmarksLoading ? (
                <div className={styles.loading}>
                    <span
                        className="material-symbols-outlined"
                        style={{ animation: 'spin 1s linear infinite' }}
                    >
                        progress_activity
                    </span>
                    Cargando marcadores...
                </div>
            ) : (
                <div className={styles.bookmarksGrid}>
                    {filteredBookmarks.length === 0 && !bookmarksLoading && (
                        <div className={styles.empty}>
                            <p className={styles.emptyTitle}>
                                {activeFilter
                                ? `Sin marcadores con la etiqueta "${activeFilter}"`
                                : 'Esta carpeta está vacía'}
                            </p>
                            <p>
                                {activeFilter
                                ? 'Proba seleccionando otra etiqueta.'
                                : 'Agrega marcadores o exploré las subcarpetas.'}
                            </p>
                        </div>
                    )}

                    {filteredBookmarks.map(bookmark => (
                        <BookmarkCard
                            key={bookmark.id}
                            bookmark={bookmark}
                            onDelete={handleDeleteBookmark}
                            onFavoriteToggle={handleFavoriteToggle}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            )}

            {/* modal nueva subcarpeta  */}
            <InputModal
                isOpen={folderModal}
                onClose={() => setFolderModal(false)}
                onConfirm={handleCreateSubfolder}
                title={currentFolder ? 'Nueva subcarpeta' : 'Nueva carpeta'}
                subtitle={
                currentFolder
                    ? `Dentro de "${currentFolder.name}"`
                    : 'Organizá tus marcadores'
                }
                icon="create_new_folder"
                label="Nombre de la carpeta"
                placeholder="Ej: Diseño, Recursos, Referencias..."
                confirmLabel="Crear carpeta"
                previewIcon="folder"
                parentName={currentFolder?.name}
            />
        </div>
    );
};