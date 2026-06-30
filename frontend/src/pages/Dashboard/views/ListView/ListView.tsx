import { useEffect } from 'react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Bookmark } from '@/types';
import { Tag } from '@/components/ui/Tag/Tag';
import { cn } from '@/utils/cn';
import { bookmarkService } from '@/services/bookmark.service';
import styles from './ListView.module.css';

interface ListViewProps {
    searchQuery: string;
    activeFolderId?: string;
    activeTagName?: string;
    onAddNew: () => void;
    favoritesOnly?: boolean;
    onEdit?: (bookmark: Bookmark) => void;
    onDelete?: (id: string) => void;
}

const getDomain = (url: string): string => {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
};

const formatDateShort = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

interface FolderCellProps {
    folder: { id: string; name: string } | null;
}

const FolderCell = ({ folder }: FolderCellProps) => {
    if (!folder) return <span className={styles.folderEmpty}>—</span>;
    return (
        <div className={styles.folderCell}>
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
    onEdit,
    onDelete,
}: ListViewProps) => {
    const { bookmarks, total, isLoading, fetchBookmarks, handleFavoriteToggle } = useBookmarks();

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
            {/* encabezado */}
            <div className={styles.tableHeader}>
                <div className={styles.colTitle}>Título</div>
                <div className={styles.colFolder}>Carpeta</div>
                <div className={styles.colTags}>Etiquetas</div>
                <div className={styles.colDate}>Fecha</div>
                <div className={styles.colActions} />
            </div>

            {/* filas  */}
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
                            <div className={styles.empty}>Sin resultados</div>
                        )}

                        {bookmarks.map(bookmark => {
                            const faviconSrc =
                                bookmark.faviconUrl || `https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=32`;

                            return (
                                <div
                                    key={bookmark.id}
                                    className={styles.row}
                                    onClick={() => window.open(bookmark.url, '_blank', 'noopener')}
                                >
                                    {/* titulo con favicon */}
                                    <div className={styles.colTitle}>
                                        <div className={styles.titleCell}>
                                            <img
                                                src={faviconSrc}
                                                alt=""
                                                className={styles.favicon}
                                                loading="lazy"
                                                onError={e => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            <div className={styles.titleMeta}>
                                                <span className={styles.titleText}>{bookmark.title}</span>
                                                <a
                                                    className={styles.urlText}
                                                    href={bookmark.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                {getDomain(bookmark.url)}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* carpeta */}
                                    <div className={styles.colFolder}>
                                        <FolderCell folder={bookmark.folder} />
                                    </div>

                                    {/* tags con color */}
                                    <div className={styles.colTags}>
                                        <div className={styles.tagsCell}>
                                            {bookmark.tags.slice(0, 3).map(bt => (
                                                <Tag
                                                    key={bt.tag.id}
                                                    label={bt.tag.name}
                                                    color={bt.tag.color}
                                                />
                                            ))}
                                            {bookmark.tags.length > 3 && (
                                                <span className={styles.tagsMore}>
                                                    {bookmark.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* fecha */}
                                    <div className={styles.colDate}>
                                        {formatDateShort(bookmark.createdAt)}
                                    </div>

                                    {/* acciones */}
                                    <div className={styles.colActions}>
                                        <div className={styles.actionsCell}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={async e => {
                                                    e.stopPropagation();
                                                    try {
                                                        const data = await bookmarkService.toggleFavorite(bookmark.id);
                                                        handleFavoriteToggle(bookmark.id, data.bookmark.isFavorite);
                                                    } catch {
                                                        // silencioso
                                                    }
                                                }}
                                                title={bookmark.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                            >
                                                <span
                                                    className="material-symbols-outlined"
                                                    style={{
                                                        fontSize: 16,
                                                        fontVariationSettings: bookmark.isFavorite ? "'FILL' 1" : "'FILL' 0",
                                                        color: bookmark.isFavorite ? '#fbbf24' : undefined,
                                                    }}
                                                >
                                                    star
                                                </span>
                                            </button>
                                            {onEdit && (
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onEdit(bookmark);
                                                    }}
                                                    title="Editar"
                                                >
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{ fontSize: 16 }}
                                                    >
                                                        edit
                                                    </span>
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    className={cn(styles.actionBtn, styles.actionBtnDanger)}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onDelete(bookmark.id);
                                                    }}
                                                    title="Eliminar"
                                                >
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{ fontSize: 16 }}
                                                    >
                                                        delete
                                                    </span>
                                                </button>
                                            )}
                                            <button
                                                className={styles.actionBtn}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    window.open(bookmark.url, '_blank', 'noopener');
                                                }}
                                                title="Abrir enlace"
                                            >
                                                <span
                                                    className="material-symbols-outlined"
                                                    style={{ fontSize: 16 }}
                                                >
                                                open_in_new
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* fila agregar nuevo */}
                        <button className={styles.addRow} onClick={onAddNew}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                add
                            </span>
                            <span>Nuevo marcador...</span>
                        </button>
                </>
                )}
            </div>

            {/* footer */}
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