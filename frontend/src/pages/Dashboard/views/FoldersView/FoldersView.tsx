import { useEffect, useState, useMemo } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Folder } from '@/types';
import { BookmarkCard } from '../../components/BookmarkCard/BookmarkCard';
import { InputModal } from '@/components/ui/InputModal/InputModal';
import { cn } from '@/utils/cn';
import styles from './FoldersView.module.css';

interface FoldersViewProps {
    searchQuery: string;
    onAddNew: () => void;
}

export const FoldersView = ({ searchQuery, onAddNew }: FoldersViewProps) => {
    const { folders, isLoading: foldersLoading, createFolder, fetchFolders } = useFolders();
    const { bookmarks, isLoading: bookmarksLoading, fetchBookmarks } = useBookmarks();

    const [activeFilter, setActiveFilter] = useState('');
    const [activeFolderPath, setActiveFolderPath] = useState<Folder[]>([]);

    // Estado del modal de nueva subcarpeta
    const [folderModal, setFolderModal] = useState(false);

    const currentFolder = activeFolderPath[activeFolderPath.length - 1];
    const currentFolderChildren = currentFolder?.children ?? folders;

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
            <h1 className={styles.title}>{currentFolder?.name ?? 'Carpetas'}</h1>
            <p className={styles.subtitle}>
                {currentFolder
                    ? `Contenido de la carpeta ${currentFolder.name}`
                    : 'Colección curada de referencias visuales, patrones de UI y recursos creativos.'}
            </p>

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
            ) : currentFolderChildren.length > 0 || !currentFolder ? (
                <>
                    <p className={styles.sectionLabel}>Subcolecciones</p>
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
                            <span className={styles.newFolderLabel}>Nueva subcarpeta</span>
                        </button>
                    </div>
                </>
            ) : null}

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
                        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
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