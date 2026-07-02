import { useState, useEffect, KeyboardEvent, FormEvent } from 'react';
import { Folder } from '@/types';
import { Tag, tagService } from '@/services/tag.service';
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
    isEditing?: boolean;
}

// aplanar arbol de carpetas 
interface FlatFolder {
    id: string;
    name: string;
    depth: number;
    parentChain: string[]; // nombres de los padres
}

const flattenFolders = (
    folders: Folder[],
    depth = 0,
    parentChain: string[] = []
): FlatFolder[] => {
    return folders.flatMap(f => [
        { id: f.id, name: f.name, depth, parentChain },
        ...flattenFolders(f.children ?? [], depth + 1, [...parentChain, f.name]),
    ]);
};

export const BookmarkForm = ({
    initialValues = {},
    folders,
    onSubmit,
    isSubmitting,
    isEditing = false,
}: BookmarkFormProps) => {
    const [url, setUrl] = useState(initialValues.url ?? '');
    const [title, setTitle] = useState(initialValues.title ?? '');
    const [description, setDescription] = useState(initialValues.description ?? '');
    const [folderId, setFolderId] = useState(initialValues.folderId ?? '');
    const [tags, setTags] = useState<string[]>(initialValues.tags ?? []);
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState<Partial<BookmarkFormValues & { form: string }>>({});

    // tags del usuario
    const [userTags, setUserTags] = useState<Tag[]>([]);

    useEffect(() => {
        tagService.list().then(data => setUserTags(data.tags)).catch(() => {});
    }, []);

    const flatFolders = flattenFolders(folders);

    // tags 
    const addTag = (tagName: string) => {
        const normalized = tagName.toLowerCase().trim();
        if (!normalized || tags.includes(normalized)) return;
        setTags(prev => [...prev, normalized]);
        setTagInput('');
    };

    const removeTag = (tagName: string) => {
        setTags(prev => prev.filter(t => t !== tagName));
    };

    const toggleTag = (tagName: string) => {
        if (tags.includes(tagName)) {
            removeTag(tagName);
        } else {
            addTag(tagName);
        }
    };

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (['Enter', ','].includes(e.key)) {
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

    // tags que el usuario tiene definidas pero no estan seleccionadas todavia
    const unselectedTags = userTags.filter(t => !tags.includes(t.name));
    // tags seleccionadas con su color
    const selectedTagsWithMeta = tags.map(name => ({
        name,
        color: userTags.find(t => t.name === name)?.color ?? '#60a5fa',
    }));

    return (
        <form
            id="bookmark-form"
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
        >
            {/* url */}
            <Input
                label="URL del marcador"
                type="url"
                placeholder="https://ejemplo.com"
                value={url}
                onChange={e => {
                    setUrl(e.target.value);
                    setErrors(prev => ({ ...prev, url: undefined }));
                }}
                error={errors.url}
                leftIcon={<span className="material-symbols-outlined">link</span>}
                autoComplete="url"
                autoFocus={!isEditing}
            />

            {/* titulo */}
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
                <label className={styles.fieldLabel}>
                    Descripción{' '}
                    <span style={{ opacity: 0.5, fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="¿Por qué guardas este enlace?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                />
            </div>

            {/* carpeta */}
            <div>
                <label className={styles.fieldLabel}>Carpeta</label>
                <div className={styles.selectWrapper}>
                    <select
                        className={styles.select}
                        value={folderId}
                        onChange={e => setFolderId(e.target.value)}
                    >
                        <option value="">Sin carpeta</option>
                        {flatFolders.map(f => {
                            const prefix = f.depth === 0
                                ? ''
                                : '\u00A0'.repeat(f.depth * 3) + '└ ';

                            return (
                                <option key={f.id} value={f.id}>
                                    {prefix}{f.name}
                                </option>
                            );
                        })}
                    </select>
                    <span className={cn('material-symbols-outlined', styles.selectIcon)}>
                        expand_more
                    </span>
                </div>

                {/* preview de la carpeta seleccionada con cadena de padres */}
                {folderId && (() => {
                    const selected = flatFolders.find(f => f.id === folderId);
                    if (!selected) return null;
                    const chain = [...selected.parentChain, selected.name];
                    return (
                        <div className={styles.folderPreview}>
                            {chain.map((segment, i) => (
                                <span key={i} className={styles.folderPreviewSegment}>
                                    {i > 0 && (
                                        <span className="material-symbols-outlined" style={{ fontSize: 12, opacity: 0.5 }}>
                                        chevron_right
                                        </span>
                                    )}
                                    <span className={i === chain.length - 1 ? styles.folderPreviewCurrent : styles.folderPreviewParent}>
                                        {segment}
                                    </span>
                                </span>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* etiquetas */}
            <div>
                <label className={styles.fieldLabel}>Etiquetas</label>

                {/* tags seleccionadas */}
                {selectedTagsWithMeta.length > 0 && (
                    <div className={styles.selectedTags}>
                        {selectedTagsWithMeta.map(tag => (
                        <button
                            key={tag.name}
                            type="button"
                            className={styles.tagChipSelected}
                            style={{
                                backgroundColor: `${tag.color}22`,
                                color: tag.color,
                                borderColor: `${tag.color}55`,
                            }}
                            onClick={() => removeTag(tag.name)}
                            title="Quitar etiqueta"
                        >
                            <span
                                className={styles.tagDot}
                                style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                            close
                            </span>
                        </button>
                        ))}
                    </div>
                )}

                {/* input para nueva etiqueta */}
                <div className={styles.tagInputWrapper}>
                    <input
                        id="tag-input"
                        className={styles.tagInput}
                        placeholder="Escribi para crear una etiqueta nueva..."
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                    />
                </div>

                {/* tags del usuario disponibles */}
                {unselectedTags.length > 0 && (
                    <div className={styles.availableTags}>
                        <span className={styles.availableTagsLabel}>
                            Tus etiquetas:
                        </span>
                        <div className={styles.availableTagsList}>
                        {unselectedTags.map(tag => (
                            <button
                                key={tag.id}
                                type="button"
                                className={styles.tagChipAvailable}
                                style={{
                                    backgroundColor: `${tag.color}18`,
                                    color: tag.color,
                                    borderColor: `${tag.color}44`,
                                }}
                                onClick={() => toggleTag(tag.name)}
                            >
                                <span
                                    className={styles.tagDot}
                                    style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                                {tag.bookmarkCount > 0 && (
                                    <span className={styles.tagBadge}>{tag.bookmarkCount}</span>
                                )}
                            </button>
                        ))}
                        </div>
                    </div>
                )}
            </div>

            {/* error global  */}
            {errors.form && (
                <div className={styles.globalError}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        error
                    </span>
                    {errors.form}
                </div>
            )}
        </form>
    );
};