import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { extApi, ExtApiError, BookmarkFull, Tag } from '../utils/api';
import { cn } from '../../../frontend/src/utils/cn';
import styles from './Popup.module.css';

interface TabInfo {
    url: string;
    title: string;
    favIconUrl: string;
}

interface PageMetadata {
    url: string;
    title: string;
    description: string;
    image: string;
    siteName: string;
}

interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    children: Folder[];
}

interface ToastState {
    message: string;
    type: 'success' | 'error';
}

type PopupView = 'loading' | 'login' | 'main';

// aplanar carpetas para el selector con indentación visual
const flattenFolders = (
    folders: Folder[],
    depth = 0
): { id: string; name: string; depth: number }[] =>
    folders.flatMap(f => [
        { id: f.id, name: f.name, depth },
        ...flattenFolders(f.children ?? [], depth + 1),
    ]);

export const Popup = () => {
    const [view, setView] = useState<PopupView>('loading');
    const [tabInfo, setTabInfo] = useState<TabInfo>({ url: '', title: '', favIconUrl: '' });
    const [metadata, setMetadata] = useState<Partial<PageMetadata>>({});
    const [folders, setFolders] = useState<Folder[]>([]);
    const [userTags, setUserTags] = useState<Tag[]>([]);
    const [toast, setToast] = useState<ToastState | null>(null);

    // marcador existente (si la URL ya está guardada)
    const [existingBookmark, setExistingBookmark] = useState<BookmarkFull | null>(null);

    // form
    const [title, setTitle] = useState('');
    const [folderId, setFolderId] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    // login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // inicializacion
    useEffect(() => {
        const init = async () => {
            const token = await storage.getToken();

            if (!token) {
                setView('login');
                return;
            }

            try {
                await extApi.me();
            } catch {
                await storage.clearAuth();
                setView('login');
                return;
            }

            // info de la pestaña activa
            chrome.runtime.sendMessage({ type: 'GET_TAB_INFO' }, async (tab: TabInfo) => {
                setTabInfo(tab);
                setTitle(tab.title);

                // verificar si la URL ya está guardada
                if (tab.url) {
                    try {
                        const existing = await extApi.getBookmarkByUrl(tab.url);
                        if (existing) {
                            setExistingBookmark(existing);
                            setTitle(existing.title);
                            setFolderId(existing.folderId ?? '');
                            setSelectedTags(existing.tags.map(bt => bt.tag.name));
                        }
                    } catch {
                        // no está guardado, continuar normal
                    }
                }
            });

            // metadatos de la página via content script
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                const tabId = tabs[0]?.id;
                if (!tabId) return;
                chrome.tabs.sendMessage(tabId, { type: 'GET_METADATA' }, (meta: PageMetadata) => {
                    if (chrome.runtime.lastError) return;
                    setMetadata(meta);
                    if (meta.title && !title) setTitle(meta.title);
                });
            });

            // carpetas y etiquetas en paralelo
            try {
                const [foldersData, tagsData] = await Promise.all([
                    extApi.getFolders(),
                    extApi.getTags(),
                ]);
                setFolders(foldersData.folders);
                setUserTags(tagsData.tags);
            } catch {
                // no bloquear por error de datos secundarios
            }

            setView('main');
        };

        init();
    }, []);

    // login
    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            setLoginError('Completá todos los campos');
            return;
        }
        setIsLoggingIn(true);
        setLoginError('');
        try {
            const data = await extApi.login(loginEmail, loginPassword);
            await storage.setToken(data.token);
            await storage.setUser({ id: data.user.id, email: data.user.email });
            window.location.reload();
        } catch (error) {
            setLoginError(
                error instanceof ExtApiError ? error.message : 'Error al iniciar sesión'
            );
        } finally {
            setIsLoggingIn(false);
        }
    };

    // toggle tag
    const toggleTag = (tagName: string) => {
        setSelectedTags(prev =>
            prev.includes(tagName)
                ? prev.filter(t => t !== tagName)
                : [...prev, tagName]
        );
    };

    // guardar o actualizar
    const handleSave = async () => {
        if (!title.trim() || !tabInfo.url) return;
        setIsSaving(true);
        try {
            if (existingBookmark) {
                // actualizar marcador existente
                await extApi.updateBookmark(existingBookmark.id, {
                    title: title.trim(),
                    folderId: folderId || null,
                    tagNames: selectedTags,
                });
                showToast('Marcador actualizado', 'success');
            } else {
                // crear nuevo
                await extApi.createBookmark({
                    title: title.trim(),
                    url: tabInfo.url,
                    description: metadata.description,
                    folderId: folderId || undefined,
                    tagNames: selectedTags.length > 0 ? selectedTags : undefined,
                });
                chrome.runtime.sendMessage({ type: 'BOOKMARK_SAVED' });
                showToast('Marcador guardado en tu archivo', 'success');
            }
            setTimeout(() => window.close(), 1500);
        } catch (error) {
            showToast(
                error instanceof ExtApiError ? error.message : 'Error al guardar',
                'error'
            );
        } finally {
            setIsSaving(false);
        }
    };

    // quitar marcador
    const handleRemove = async () => {
        if (!tabInfo.url) return;
        setIsRemoving(true);
        try {
            await extApi.deleteBookmarkByUrl(tabInfo.url);
            chrome.runtime.sendMessage({ type: 'BOOKMARK_REMOVED' });
            showToast('Marcador eliminado', 'error');
            setTimeout(() => window.close(), 1500);
        } catch {
            showToast('No se encontró el marcador para eliminar', 'error');
        } finally {
            setIsRemoving(false);
        }
    };

    const flatFolders = flattenFolders(folders);

    // Loading 
    if (view === 'loading') {
        return (
            <div className={styles.popup}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={cn('material-symbols-outlined', styles.headerIcon)}>
                            bookmark
                        </span>
                        <span className={styles.headerTitle}>Árbol</span>
                    </div>
                </div>
                <div className={styles.centerState}>
                    <div className={styles.spinner} />
                    <p className={styles.stateSub}>Cargando...</p>
                </div>
            </div>
        );
    }

    // Login 
    if (view === 'login') {
        return (
            <div className={styles.popup}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={cn('material-symbols-outlined', styles.headerIcon)}>
                            bookmark
                        </span>
                        <span className={styles.headerTitle}>Árbol</span>
                    </div>
                </div>
                <div className={styles.body}>
                    <div className={styles.centerState}>
                        <span className={cn('material-symbols-outlined', styles.stateIcon)}>
                            lock
                        </span>
                        <h2 className={styles.stateTitle}>Ingresá a tu cuenta</h2>
                        <p className={styles.stateSub}>
                            Necesitás iniciar sesión para guardar marcadores.
                        </p>
                        <div className={styles.loginForm}>
                            <input
                                className={styles.loginInput}
                                type="email"
                                placeholder="tu@email.com"
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                autoFocus
                            />
                            <input
                                className={styles.loginInput}
                                type="password"
                                placeholder="Contraseña"
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                            {loginError && (
                                <span className={styles.loginError}>{loginError}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.footer}>
                    <button
                        className={styles.btnSave}
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        style={{ gridColumn: '1 / -1' }}
                    >
                        {isLoggingIn
                            ? <span className={styles.spinner} />
                            : <span className="material-symbols-outlined" style={{ fontSize: 20 }}>login</span>
                        }
                        Ingresar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.popup}>
            {/* cabecera */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {/* ícono filled si la URL ya está guardada */}
                    <span
                        className={cn('material-symbols-outlined', styles.headerIcon)}
                        style={{
                            fontVariationSettings: existingBookmark ? "'FILL' 1" : "'FILL' 0",
                        }}
                    >
                        bookmark
                    </span>
                    <span className={styles.headerTitle}>Árbol</span>
                    {existingBookmark && (
                        <span className={styles.savedBadge}>Guardado</span>
                    )}
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.iconBtn}
                        title="Cerrar"
                        onClick={() => window.close()}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            close
                        </span>
                    </button>
                </div>
            </div>

            {/* cuerpo */}
            <div className={styles.body}>
                {/* preview de la página */}
                <div className={styles.preview}>
                    {metadata.image ? (
                        <img
                            className={styles.previewImage}
                            src={metadata.image}
                            alt="Vista previa"
                        />
                    ) : (
                        <div className={styles.previewPlaceholder}>
                            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
                                language
                            </span>
                            <span style={{ fontSize: 'var(--font-size-caption)' }}>
                                Sin vista previa
                            </span>
                        </div>
                    )}
                    <div className={styles.previewOverlay} />
                </div>

                {/* identidad de la página */}
                <div className={styles.pageIdentity}>
                    <div className={styles.favicon}>
                        {tabInfo.favIconUrl ? (
                            <img
                                className={styles.faviconImg}
                                src={tabInfo.favIconUrl}
                                alt="Favicon"
                                onError={e => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <span className={cn('material-symbols-outlined', styles.faviconFallback)}>
                                language
                            </span>
                        )}
                    </div>
                    <div className={styles.pageNameWrapper}>
                        <span className={styles.pageNameLabel}>Nombre</span>
                        <input
                            className={styles.pageNameInput}
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Título del marcador..."
                        />
                    </div>
                </div>

                {/* banner: guardado con carpeta y tags actuales */}
                {existingBookmark && (
                    <div className={styles.savedInfo}>
                        <span
                            className={cn('material-symbols-outlined', styles.savedInfoIcon)}
                        >
                            check_circle
                        </span>
                        <div className={styles.savedInfoBody}>
                            <span className={styles.savedInfoTitle}>
                                Ya está en tu archivo
                            </span>
                            <div className={styles.savedInfoMeta}>
                                <span className={styles.savedInfoFolder}>
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ fontSize: 12 }}
                                    >
                                        folder
                                    </span>
                                    {existingBookmark.folder
                                        ? existingBookmark.folder.name
                                        : 'Sin carpeta'
                                    }
                                </span>
                                {existingBookmark.tags.length > 0 && (
                                    <div className={styles.savedInfoTags}>
                                        {existingBookmark.tags.map(bt => (
                                            <span
                                                key={bt.tag.id}
                                                className={styles.savedInfoTag}
                                                style={{
                                                    backgroundColor: `${bt.tag.color}22`,
                                                    color: bt.tag.color,
                                                    borderColor: `${bt.tag.color}44`,
                                                }}
                                            >
                                                <span
                                                    className={styles.tagDot}
                                                    style={{ backgroundColor: bt.tag.color }}
                                                />
                                                {bt.tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* selector de carpeta */}
                <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Carpeta</span>
                    <div className={styles.fieldInputWrapper}>
                        <span className={cn('material-symbols-outlined', styles.fieldIcon)}>
                            folder
                        </span>
                        <select
                            className={styles.fieldSelectFull}
                            value={folderId}
                            onChange={e => setFolderId(e.target.value)}
                        >
                            <option value="">Sin carpeta</option>
                            {flatFolders.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.depth > 0
                                        ? '\u00A0'.repeat(f.depth * 3) + '└ ' + f.name
                                        : f.name
                                    }
                                </option>
                            ))}
                        </select>
                        <span className={cn('material-symbols-outlined', styles.selectArrow)}>
                            expand_more
                        </span>
                    </div>
                </div>

                {/* etiquetas del usuario */}
                <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Etiquetas</span>
                    {userTags.length === 0 ? (
                        <p className={styles.tagsEmpty}>
                            No tenés etiquetas creadas todavía.
                        </p>
                    ) : (
                        <div className={styles.tagsGrid}>
                            {userTags.map(tag => {
                                const isSelected = selectedTags.includes(tag.name);
                                return (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        className={cn(
                                            styles.tagChip,
                                            isSelected && styles.tagChipSelected
                                        )}
                                        style={isSelected ? {
                                            backgroundColor: `${tag.color}22`,
                                            color: tag.color,
                                            borderColor: `${tag.color}55`,
                                        } : undefined}
                                        onClick={() => toggleTag(tag.name)}
                                    >
                                        <span
                                            className={styles.tagDot}
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                        {isSelected && (
                                            <span
                                                className="material-symbols-outlined"
                                                style={{ fontSize: 12 }}
                                            >
                                                check
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* footer */}
            <div className={styles.footer}>
                <button
                    className={styles.btnSave}
                    onClick={handleSave}
                    disabled={isSaving || isRemoving || !title.trim()}
                >
                    {isSaving ? (
                        <span className={styles.spinner} />
                    ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            {existingBookmark ? 'edit' : 'add_circle'}
                        </span>
                    )}
                    {existingBookmark ? 'ACTUALIZAR' : 'AGREGAR'}
                </button>

                <button
                    className={styles.btnRemove}
                    onClick={handleRemove}
                    disabled={isSaving || isRemoving}
                >
                    {isRemoving ? (
                        <span className={styles.spinner} />
                    ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            delete_outline
                        </span>
                    )}
                    QUITAR
                </button>
            </div>

            {/* toast */}
            {toast && (
                <div className={cn(
                    styles.toast,
                    toast.type === 'success' ? styles.toastSuccess : styles.toastError
                )}>
                    <span
                        className={cn('material-symbols-outlined', styles.toastIcon)}
                        style={{ fontSize: 18 }}
                    >
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {toast.message}
                </div>
            )}
        </div>
    );
};