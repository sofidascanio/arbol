import { useEffect, useState } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Folder } from '@/types';
import { BookmarkCard } from '../../components/BookmarkCard/BookmarkCard';
import { cn } from '@/utils/cn';
import styles from './FoldersView.module.css';

interface FoldersViewProps {
    searchQuery: string;
    onAddNew: () => void;
}

const QUICK_FILTERS = [
    { label: 'Todos', value: '' },
    { label: 'Sitios web', value: 'web' },
    { label: 'Apps móviles', value: 'mobile' },
    { label: 'Ilustración', value: 'illustration' },
    { label: 'Arte 3D', value: '3d' },
];

export const FoldersView = ({ searchQuery, onAddNew }: FoldersViewProps) => {
    const { folders, isLoading: foldersLoading, createFolder } = useFolders();
    const { bookmarks, isLoading: bookmarksLoading, fetchBookmarks } = useBookmarks();
    const [activeFilter, setActiveFilter] = useState('');
    const [activeFolderPath, setActiveFolderPath] = useState<Folder[]>([]);

    const currentFolder = activeFolderPath[activeFolderPath.length - 1];
    const currentFolderChildren = currentFolder?.children ?? folders;

    useEffect(() => {
        fetchBookmarks({
            search: searchQuery || undefined,
            folderId: currentFolder?.id,
            tag: activeFilter || undefined,
        });
    }, [searchQuery, currentFolder?.id, activeFilter]); 

    const handleFolderClick = (folder: Folder) => {
        setActiveFolderPath(prev => [...prev, folder]);
    };

    const handleBreadcrumbClick = (index: number) => {
        setActiveFolderPath(prev => prev.slice(0, index + 1));
    };

    const handleRootClick = () => {
        setActiveFolderPath([]);
    };

    const handleNewSubfolder = async () => {
        const name = prompt('Nombre de la nueva subcarpeta:');
        if (!name?.trim()) return;
            try {
            await createFolder({
                name: name.trim(),
                parentId: currentFolder?.id,
            });
        } catch {
            alert('No se pudo crear la carpeta');
        }
    };

    return (
        <div className={styles.container}>
            {/* breadcrumb  */}
            <div className={styles.breadcrumb}>
                <span style={{ cursor: 'pointer' }}
                    onClick={handleRootClick}>
                    Archivo
                </span>
                {activeFolderPath.map((folder, i) => (
                <>
                    <span key={`sep-${folder.id}`}
                        className={cn('material-symbols-outlined', styles.breadcrumbIcon)}>
                        chevron_right
                    </span>
                    <span key={folder.id}
                        className={
                            i === activeFolderPath.length - 1
                            ? styles.breadcrumbCurrent
                            : ''
                        }
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleBreadcrumbClick(i)}>
                        {folder.name}
                    </span>
                </>
                ))}
            </div>

            {/* encabezado  */}
            <h1 className={styles.title}>
                {currentFolder?.name ?? 'Carpetas'}
            </h1>
            <p className={styles.subtitle}>
                {currentFolder
                ? `Contenido de la carpeta ${currentFolder.name}`
                : 'Colección curada de referencias visuales, patrones de UI y recursos creativos.'}
            </p>

            {/* subcarpetas  */}
            {foldersLoading ? (
                <div className={styles.loading}>
                    <span className="material-symbols-outlined"
                        style={{ animation: 'spin 1s linear infinite' }}>
                        progress_activity
                    </span>
                </div>
            ) : currentFolderChildren.length > 0 || !currentFolder ? (
                <>
                    <p className={styles.sectionLabel}>Subcolecciones</p>
                    <div className={styles.foldersGrid}>
                        {currentFolderChildren.map(folder => (
                            <button key={folder.id}
                                    className={styles.folderCard}
                                    onClick={() => handleFolderClick(folder)}>
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

                        {/* Nueva subcarpeta */}
                        <button className={styles.newFolderCard}
                                onClick={handleNewSubfolder}>
                            <div className={styles.newFolderIconWrapper}>
                                <span className="material-symbols-outlined">add</span>
                            </div>
                            <span className={styles.newFolderLabel}>Nueva subcarpeta</span>
                        </button>
                    </div>
                </>
            ) : null}

            {/* filtros rapidos  */}
            <div className={styles.filters}>
                <span className={styles.filterLabel}>Filtros rápidos:</span>
                {QUICK_FILTERS.map(f => (
                    <button key={f.value}
                            className={cn(
                            styles.filterChip,
                            activeFilter === f.value && styles.filterChipActive
                            )}
                            onClick={() => setActiveFilter(f.value)}
                        >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* marcadores de la carpeta  */}
            {bookmarksLoading ? (
                <div className={styles.loading}>
                    <span className="material-symbols-outlined"
                        style={{ animation: 'spin 1s linear infinite' }}>
                        progress_activity
                    </span>
                    Cargando marcadores...
                </div>
            ) : (
                <div className={styles.bookmarksGrid}>
                    {bookmarks.map(bookmark => (
                        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                    ))}
                </div>
            )}
        </div>
    );
};