import { useEffect } from 'react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Tag } from '@/components/ui/Tag/Tag';
import { cn } from '@/utils/cn';
import styles from './ListView.module.css';

interface ListViewProps {
    searchQuery: string;
    activeFolderId?: string;
    activeTagName?: string;
    onAddNew: () => void;
    favoritesOnly?: boolean;
}

const ICON_BY_DOMAIN: Record<string, string> = {
    'youtube.com': 'video_library',
    'github.com': 'code',
    'notion.so': 'description',
    'figma.com': 'palette',
};

const getIcon = (url: string): string => {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return ICON_BY_DOMAIN[domain] || 'language';
    } catch {
        return 'language';
    }
};

const formatDateShort = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// helper: mostrar carpeta con indicador de subcarpeta 
interface FolderCellProps {
    folder: { id: string; name: string } | null;
}

const FolderCell = ({ folder }: FolderCellProps) => {
    if (!folder) {
        return <span className={styles.folderEmpty}>—</span>;
    }

    return (
        <div className={styles.folderCell}>
            {/* <span className="material-symbols-outlined" style={{ fontSize: 14, flexShrink: 0 }}>
                folder
            </span> */}
            <span className={styles.folderName}>{folder.name}</span>
        </div>
    );
};

export const ListView = ({
    searchQuery,
    activeFolderId,
    activeTagName,
    onAddNew,
    favoritesOnly,
}: ListViewProps) => {
    const { bookmarks, total, isLoading, fetchBookmarks } = useBookmarks();

    useEffect(() => {
        fetchBookmarks({
            search: searchQuery || undefined,
            folderId: activeFolderId,
            tag: activeTagName || undefined,
            favoritesOnly: favoritesOnly || undefined,
        });
    }, [searchQuery, activeFolderId, activeTagName, favoritesOnly]);

    return (
        <div className={styles.container}>
            {/* encabezado de tabla  */}
            <div className={styles.tableHeader}>
                <div className={styles.colIcon} />
                <div className={styles.colTitle}>Título</div>
                <div className={styles.colUrl}>URL</div>
                <div className={styles.colFolder}>Carpeta</div>
                <div className={styles.colTags}>Etiquetas</div>
                <div className={styles.colDate}>Fecha</div>
                <div className={styles.colAction} />
            </div>

            {/* Filas */}
            <div className={styles.rows}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <span
                            className="material-symbols-outlined"
                            style={{ animation: 'spin 1s linear infinite', fontSize: 24 }}
                        >
                        progress_activity
                        </span>
                        Cargando...
                    </div>
                ) : (
                    <>
                        {bookmarks.length === 0 && (
                            <div className={styles.empty}>
                                Sin resultados
                            </div>
                        )}

                        {bookmarks.map(bookmark => (
                            <div
                                key={bookmark.id}
                                className={styles.row}
                                onClick={() => window.open(bookmark.url, '_blank', 'noopener')}
                            >
                                {/* icono */}
                                <div className={styles.rowIcon}>
                                    <span className="material-symbols-outlined">
                                        {getIcon(bookmark.url)}
                                    </span>
                                </div>

                                {/* titulo */}
                                <div className={styles.rowTitle}>{bookmark.title}</div>

                                {/* url */}
                                <div className={styles.rowUrl}>
                                    <a
                                        className={styles.rowUrlLink}
                                        href={bookmark.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {bookmark.url}
                                    </a>
                                </div>

                                {/* carpeta */}
                                <div className={styles.colFolder}>
                                    <FolderCell folder={bookmark.folder} />
                                </div>

                                {/* tags */}
                                <div className={styles.rowTags}>
                                    {bookmark.tags.slice(0, 2).map((bt, i) => (
                                        <Tag
                                            key={bt.tag.id}
                                            label={bt.tag.name.toUpperCase()}
                                            variant={i === 0 ? 'default' : 'surface'}
                                        />
                                    ))}
                                </div>

                                {/* fecha */}
                                <div className={styles.rowDate}>
                                    {formatDateShort(bookmark.createdAt)}
                                </div>

                                {/* accion */}
                                <div className={styles.rowAction}>
                                    <button
                                        className={styles.openBtn}
                                        onClick={e => {
                                        e.stopPropagation();
                                        window.open(bookmark.url, '_blank', 'noopener');
                                        }}
                                        title="Abrir enlace"
                                    >
                                        <span
                                            className="material-symbols-outlined"
                                            style={{ fontSize: 18 }}
                                        >
                                        open_in_new
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Fila agregar nuevo */}
                        <button className={styles.addRow} onClick={onAddNew}>
                            <div className={styles.rowIcon}>
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 18 }}
                                >
                                add
                                </span>
                            </div>
                            <span style={{ fontSize: 'var(--font-size-body-md)' }}>
                                Nuevo marcador...
                            </span>
                        </button>
                    </>
                )}
            </div>

            {/* footer  */}
            <div className={styles.footer}>
                <div className={styles.footerLeft}>
                    <span>{total} marcadores</span>
                    <div className={styles.footerDot} />
                    <span>Sincronizado</span>
                </div>
                <div className={styles.footerRight}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        cloud_done
                    </span>
                    <span>En la nube</span>
                </div>
            </div>
        </div>
    );
};