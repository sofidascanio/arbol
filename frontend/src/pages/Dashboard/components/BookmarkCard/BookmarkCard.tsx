import { useState } from 'react';
import { Bookmark } from '@/types';
import { Tag } from '@/components/ui/Tag/Tag';
import { cn } from '@/utils/cn';
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
    const diffDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
    return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export const BookmarkCard = ({
    bookmark,
    onDelete,
    onFavoriteToggle,
    className,
}: BookmarkCardProps) => {
    const [imageError, setImageError] = useState(false);
    const [faviconError, setFaviconError] = useState(false);

    // fallback del favicon via google s2 si no viene del backend
    const faviconSrc =
        bookmark.faviconUrl ||
        `https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=64`;

    // la preview usa imageUrl, y si falla o no existe, usa el favicon como placeholder
    const showImagePreview = bookmark.imageUrl && !imageError;
    const showFaviconAsPreview = !showImagePreview && !faviconError;

    const handleOpen = () => window.open(bookmark.url, '_blank', 'noopener');

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(bookmark.id);
    };

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { bookmarkService } = await import('@/services/bookmark.service');
            const data = await bookmarkService.toggleFavorite(bookmark.id);
            onFavoriteToggle?.(bookmark.id, data.bookmark.isFavorite);
        } catch {
            // silencioso
        }
    };

    return (
        <article
        className={cn(styles.card, className)}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleOpen()}
        aria-label={`Abrir ${bookmark.title}`}
        >
            {/* ─── Imagen / Preview ──────────────────────────────────────────── */}
            <div className={styles.imageWrapper}>
                {showImagePreview ? (
                <img
                    className={styles.image}
                    src={bookmark.imageUrl!}
                    alt={bookmark.title}
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
                ) : showFaviconAsPreview ? (
                /* Favicon como placeholder de imagen */
                <div className={styles.faviconPreview}>
                    <img
                    src={faviconSrc}
                    alt={getDomain(bookmark.url)}
                    className={styles.faviconPreviewImg}
                    onError={() => setFaviconError(true)}
                    loading="lazy"
                    />
                    <span className={styles.faviconPreviewDomain}>
                    {getDomain(bookmark.url)}
                    </span>
                </div>
                ) : (
                /* Fallback genérico si todo falla */
                <div className={styles.imagePlaceholder}>
                    <span className="material-symbols-outlined">language</span>
                </div>
                )}

                {/* Acciones flotantes */}
                <div className={styles.actions}>
                <button
                    className={styles.actionBtn}
                    onClick={handleFavorite}
                    title={bookmark.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                    <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: 18,
                        fontVariationSettings: bookmark.isFavorite ? "'FILL' 1" : "'FILL' 0",
                        color: bookmark.isFavorite ? '#fbbf24' : undefined,
                    }}
                    >
                    star
                    </span>
                </button>

                <button
                    className={styles.actionBtn}
                    onClick={e => { e.stopPropagation(); handleOpen(); }}
                    title="Abrir enlace"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    open_in_new
                    </span>
                </button>

                {onDelete && (
                    <button
                    className={styles.actionBtn}
                    onClick={handleDelete}
                    title="Eliminar"
                    >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        delete
                    </span>
                    </button>
                )}
                </div>
            </div>

            {/* ─── Cuerpo ────────────────────────────────────────────────────── */}
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

                {/* footer con favicon + dominio */}
                <div className={styles.footer}>
                    <div className={styles.source}>
                        {!faviconError ? (
                            <img
                                src={faviconSrc}
                                alt=""
                                className={styles.faviconSmall}
                                onError={() => setFaviconError(true)}
                                loading="lazy"
                            />
                        ) : (
                            <span className={cn('material-symbols-outlined', styles.sourceIcon)}>
                                language
                            </span>
                        )}
                        <span className={styles.sourceText}>{getDomain(bookmark.url)}</span>
                    </div>
                        <span className={styles.date}>{formatDate(bookmark.createdAt)}</span>
                </div>
            </div>
        </article>
    );
};