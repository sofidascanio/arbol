import { Bookmark } from '@/types';
import { Tag } from '@/components/ui/Tag/Tag';
import { cn } from '@/utils/cn';
import { bookmarkService } from '@/services/bookmark.service';
import styles from './BookmarkCard.module.css';

interface BookmarkCardProps {
    bookmark: Bookmark;
    onDelete?: (id: string) => void;
    onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
    className?: string;
}

const getDomain = (url: string): string => {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const BookmarkCard = ({
    bookmark,
    onDelete,
    onFavoriteToggle,
    className,
}: BookmarkCardProps) => {
    const handleOpen = () => window.open(bookmark.url, '_blank', 'noopener');

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(bookmark.id);
    };

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const data = await bookmarkService.toggleFavorite(bookmark.id);
            onFavoriteToggle?.(bookmark.id, data.bookmark.isFavorite);
        } catch {
            // silencioso
        }
    };

    return (
        <article className={cn(styles.card, className)}
                onClick={handleOpen}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleOpen()}
                aria-label={`Abrir ${bookmark.title}`}
                >
            {/* imagen  */}
            <div className={styles.imageWrapper}>
                <div className={styles.imagePlaceholder}>
                <span className="material-symbols-outlined">language</span>
                </div>

                {/* acciones flotantes */}
                <div className={styles.actions}>
                    <button className={styles.actionBtn}
                            onClick={e => { e.stopPropagation(); handleOpen(); }}
                            title="Abrir enlace">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            open_in_new
                        </span>
                    </button>
                    {onDelete && (
                        <button className={styles.actionBtn}
                                onClick={handleDelete}
                                title="Eliminar">
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                delete
                            </span>
                        </button>
                    )}
                    <button
                        className={styles.actionBtn}
                        onClick={handleFavorite}
                        title={bookmark.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: 18,
                                fontVariationSettings: bookmark.isFavorite
                                    ? "'FILL' 1"
                                    : "'FILL' 0",
                                color: bookmark.isFavorite ? '#fbbf24' : undefined,
                            }}
                        >
                            star
                        </span>
                    </button>
                </div>
            </div>

            {/* cuerpo  */}
            <div className={styles.body}>
                {bookmark.tags.length > 0 && (
                    <div className={styles.tagRow}>
                        {bookmark.tags.slice(0, 2).map((bt, i) => (
                            <Tag
                                key={bt.tag.id}
                                label={bt.tag.name}
                                variant={i === 0 ? 'default' : 'tertiary'}
                            />
                        ))}
                    </div>
                )}

                <h3 className={styles.title}>{bookmark.title}</h3>

                {bookmark.description && (
                    <p className={styles.description}>{bookmark.description}</p>
                )}

                <div className={styles.footer}>
                    <div className={styles.source}>
                        <span className={cn('material-symbols-outlined', styles.sourceIcon)}>
                            language
                        </span>
                        <span className={styles.sourceText}>{getDomain(bookmark.url)}</span>
                    </div>
                    <span className={styles.date}>{formatDate(bookmark.createdAt)}</span>
                </div>
            </div>
        </article>
    );
};