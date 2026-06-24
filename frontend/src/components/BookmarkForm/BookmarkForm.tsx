import { useState, KeyboardEvent, FormEvent } from 'react';
import { Bookmark, Folder } from '@/types';
import { Input } from '@/components/ui/Input/Input';
import { cn } from '@/utils/cn';
import styles from './BookmarkForm.module.css';

interface BookmarkFormValues {
    title: string;
    url: string;
    description: string;
    folderId: string;
    tags: string[];
}

interface BookmarkFormProps {
    initialValues?: Partial<BookmarkFormValues>;
    folders: Folder[];
    onSubmit: (values: BookmarkFormValues) => Promise<void>;
    isSubmitting: boolean;
}

const TAG_SUGGESTIONS = [
    'diseño', 'ux', 'ingeniería', 'recursos',
    'inspiración', 'tipografía', 'arquitectura', 'ia',
];

// aplana arbol de carpetas para el selector
const flattenFolders = (
    folders: Folder[],
    depth = 0
): { id: string; name: string; depth: number }[] => {
    return folders.flatMap(f => [
        { id: f.id, name: f.name, depth },
        ...flattenFolders(f.children ?? [], depth + 1),
    ]);
};

export const BookmarkForm = ({
    initialValues = {},
    folders,
    onSubmit,
    isSubmitting,
}: BookmarkFormProps) => {
    const [url, setUrl] = useState(initialValues.url ?? '');
    const [title, setTitle] = useState(initialValues.title ?? '');
    const [description, setDescription] = useState(initialValues.description ?? '');
    const [folderId, setFolderId] = useState(initialValues.folderId ?? '');
    const [tags, setTags] = useState<string[]>(initialValues.tags ?? []);
    const [tagInput, setTagInput] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchDone, setFetchDone] = useState(false);
    const [errors, setErrors] = useState<Partial<BookmarkFormValues & { form: string }>>({});

    const flatFolders = flattenFolders(folders);

    // fetch de metadatos de la url
    const handleFetch = async () => {
        if (!url.trim()) {
            setErrors(prev => ({ ...prev, url: 'Ingresa una URL' }));
            return;
        }

        try {
            new URL(url); // valida formato
        } catch {
            setErrors(prev => ({ ...prev, url: 'URL inválida' }));
            return;
        }

        setIsFetching(true);
        setErrors(prev => ({ ...prev, url: undefined }));

        // simula delay de fetch de metadatos
        await new Promise(r => setTimeout(r, 1200));

        try {
            const domain = new URL(url).hostname.replace('www.', '');
            if (!title) {
                setTitle(`Página de ${domain}`);
            }
            setFetchDone(true);
        } finally {
            setIsFetching(false);
        }
    };

    // manejo de tags 
    const addTag = (tag: string) => {
        const normalized = tag.toLowerCase().trim();
        if (!normalized || tags.includes(normalized)) return;
        setTags(prev => [...prev, normalized]);
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (['Enter', ',', ' '].includes(e.key)) {
            e.preventDefault();
            addTag(tagInput);
        }
        if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    // validacion y envio
    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!url.trim()) {
            newErrors.url = 'La URL es requerida';
        } else {
            try { new URL(url); } catch {
                newErrors.url = 'Formato de URL inválido';
            }
        }

        if (!title.trim()) {
            newErrors.title = 'El título es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        await onSubmit({
            url: url.trim(),
            title: title.trim(),
            description: description.trim(),
            folderId,
            tags,
        });
    };

    return (
        <form id="bookmark-form"
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate>
            {/* url */}
            <div>
                <div className={styles.urlRow}>
                    <div className={styles.urlInput}>
                        <Input
                            label="URL del marcador"
                            type="url"
                            placeholder="https://ejemplo.com"
                            value={url}
                            onChange={e => {
                                setUrl(e.target.value);
                                setFetchDone(false);
                                setErrors(prev => ({ ...prev, url: undefined }));
                            }}
                            error={errors.url}
                            leftIcon={
                                <span className="material-symbols-outlined">link</span>
                            }
                            autoComplete="url"
                            autoFocus
                        />
                    </div>
                    <button
                        type="button"
                        className={cn(
                        styles.fetchBtn,
                        fetchDone && styles.fetchBtnDone
                        )}
                        onClick={handleFetch}
                        disabled={isFetching || fetchDone}
                    >
                        {isFetching ? (
                            <>
                                <span className="material-symbols-outlined"
                                    style={{ fontSize: 18, animation: 'spin 0.8s linear infinite' }}
                                >
                                progress_activity
                                </span>
                                Obteniendo...
                            </>
                        ) : fetchDone ? (
                            <>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                check
                                </span>
                                Listo
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                magic_button
                                </span>
                                Obtener datos
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* titulo  */}
            <Input
                label="Título"
                type="text"
                placeholder="Título de la página"
                value={title}
                onChange={e => {
                setTitle(e.target.value);
                setErrors(prev => ({ ...prev, title: undefined }));
                }}
                error={errors.title}
            />

            {/* descripcion */}
            <div>
                <label className={styles.tagsLabel}>
                Descripción <span style={{ opacity: 0.5, fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="¿Por qué guardas este enlace?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                />
            </div>

            {/* organizacion: carpeta  */}
            <div className={styles.orgRow}>
                <div>
                    <label className={styles.selectLabel}>Carpeta</label>
                    <div className={styles.selectWrapper}>
                        <select
                            className={styles.select}
                            value={folderId}
                            onChange={e => setFolderId(e.target.value)}
                        >
                            <option value="">Sin carpeta</option>
                            {flatFolders.map(f => (
                                <option key={f.id} value={f.id}>
                                    {'  '.repeat(f.depth)}{f.depth > 0 ? '↳ ' : ''}{f.name}
                                </option>
                            ))}
                        </select>
                        <span className={cn('material-symbols-outlined', styles.selectIcon)}>
                        expand_more
                        </span>
                    </div>
                </div>

                {/* espacio para futura funcionalidad */}
                <div>
                    <label className={styles.selectLabel}>Visibilidad</label>
                    <div className={styles.selectWrapper}>
                        <select className={styles.select} defaultValue="private">
                            <option value="private">Privado</option>
                            <option value="public">Público</option>
                        </select>
                        <span className={cn('material-symbols-outlined', styles.selectIcon)}>
                        expand_more
                        </span>
                    </div>
                </div>
            </div>

            {/* tags */}
            <div>
                <label className={styles.tagsLabel}>Etiquetas</label>
                <div className={styles.tagsArea}
                    onClick={() => document.getElementById('tag-input')?.focus()}
                >
                    {tags.map(tag => (
                        <span key={tag} className={styles.tagChip}>
                            {tag}
                            <button
                                type="button"
                                className={styles.tagRemove}
                                onClick={() => removeTag(tag)}
                                aria-label={`Eliminar etiqueta ${tag}`}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                close
                                </span>
                            </button>
                        </span>
                    ))}
                    <input
                        id="tag-input"
                        className={styles.tagInput}
                        placeholder={tags.length === 0 ? 'Agregar etiqueta...' : ''}
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                    />
                </div>

                {/* sugerencias */}
                <div className={styles.tagSuggestions}>
                    <span className={styles.tagSugLabel}>Sugerencias:</span>
                    {TAG_SUGGESTIONS.filter(s => !tags.includes(s)).slice(0, 4).map(s => (
                        <button
                            key={s}
                            type="button"
                            className={styles.tagSugChip}
                            onClick={() => addTag(s)}
                        >
                        + {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* error global */}
            {errors.form && (
                <div style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--error-container)',
                    color: 'var(--on-error-container)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-body-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                    {errors.form}
                </div>
            )}
        </form>
    );
};