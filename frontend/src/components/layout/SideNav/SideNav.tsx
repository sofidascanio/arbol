import { NavLink } from 'react-router-dom';
import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Folder } from '@/types';
import { cn } from '@/utils/cn';
import { Tag } from '@/services/tag.service';
import styles from './SideNav.module.css';

interface SideNavProps {
    folders: Folder[];
    tags: Tag[];
    activeFolderId?: string;
    activeTagName?: string;
    onFolderClick: (folderId: string) => void;
    onTagClick: (tagName: string) => void;
    onNewFolder: () => void;
    onNewTag: () => void;
    onNewSubfolder?: (parentId: string, parentName: string) => void;
    onClearActive?: () => void;
    onDeleteTag?: (tagId: string, tagName: string) => void;
}

export const SideNav = ({
    folders,
    tags,
    activeFolderId,
    activeTagName,
    onFolderClick,
    onTagClick,
    onNewFolder,
    onNewTag,
    onNewSubfolder,
    onClearActive,
    onDeleteTag,
}: SideNavProps) => {
    const { user, logout } = useAuth();

    // estado de colapso de secciones
    const [foldersOpen, setFoldersOpen] = useState(true);
    const [tagsOpen, setTagsOpen] = useState(true);

    const MIN_WIDTH = 180;
    const MAX_WIDTH = 480;
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const isResizing = useRef(false);

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
            setSidebarWidth(newWidth);
            document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        };

        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, []);

    return (
        <aside className={styles.sidebar} style={{ width: sidebarWidth }}>
            <div className={styles.resizeHandle} onMouseDown={handleResizeStart} />
            {/* marca */}
            <NavLink to="/" end className={styles.brand} onClick={onClearActive}>
                <div className={styles.brandIcon}>
                    <span className="material-symbols-outlined">park</span>
                </div>
                <div className={styles.brandText}>
                    <span className={styles.brandName}>Arbol</span>
                    <span className={styles.brandSub}>Archivo personal</span>
                </div>
            </NavLink>

            {/* navegacion  */}
            <nav className={styles.nav}>
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        cn(styles.navItem, isActive && styles.navItemActive)
                    }
                    onClick={onClearActive}
                >
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        bookmark
                    </span>
                    <span className={styles.navItemLabel}>Todos los marcadores</span>
                </NavLink>

                <NavLink
                    to="/favorites"
                    className={({ isActive }) =>
                        cn(styles.navItem, isActive && styles.navItemActive)
                    }
                >
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        star
                    </span>
                    <span className={styles.navItemLabel}>Favoritos</span>
                </NavLink>

                {/* seccion carpetas  */}
                <div
                    className={styles.sectionRow}
                    onClick={() => setFoldersOpen(prev => !prev)}
                >
                    <span className={styles.sectionLabel}>Carpetas</span>
                    <span
                        className={cn(
                            'material-symbols-outlined',
                            styles.sectionChevron,
                            foldersOpen && styles.sectionChevronOpen
                        )}
                    >
                        chevron_right
                    </span>
                    {/* boton + ,detiene propagacion para no colapsar al hacer click */}
                    <button
                        className={styles.sectionAddBtn}
                        onClick={e => {
                            e.stopPropagation();
                            onNewFolder();
                        }}
                        title="Nueva carpeta"
                        aria-label="Nueva carpeta"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        add
                        </span>
                    </button>
                </div>

                <div
                    className={cn(
                        styles.sectionContent,
                        !foldersOpen && styles.sectionContentHidden
                    )}
                >
                    {folders.length === 0 ? (
                        <span className={styles.emptyHint}>Sin carpetas todavía</span>
                    ) : (
                        folders.map(folder => (
                            <FolderNavItem
                                key={folder.id}
                                folder={folder}
                                activeFolderId={activeFolderId}
                                onFolderClick={onFolderClick}
                                onNewSubfolder={onNewSubfolder}
                                depth={0}
                            />
                        ))
                    )}
                </div>

                {/* seccion etiquetas */}
                <div
                    className={styles.sectionRow}
                    onClick={() => setTagsOpen(prev => !prev)}
                >
                    <span className={styles.sectionLabel}>Etiquetas</span>
                    <span
                        className={cn(
                            'material-symbols-outlined',
                            styles.sectionChevron,
                            tagsOpen && styles.sectionChevronOpen
                        )}
                    >
                        chevron_right
                    </span>
                    <button
                        className={styles.sectionAddBtn}
                        onClick={e => {
                            e.stopPropagation();
                            onNewTag();
                        }}
                        title="Nueva etiqueta"
                        aria-label="Nueva etiqueta"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        add
                        </span>
                    </button>
                </div>

                <div
                    className={cn(
                        styles.sectionContent,
                        !tagsOpen && styles.sectionContentHidden
                    )}
                >
                    {tags.length === 0 ? (
                        <span className={styles.emptyHint}>Sin etiquetas todavía</span>
                    ) : (
                        tags.map(tag => (
                            <div
                                key={tag.id}
                                className={cn(
                                    styles.tagRow,
                                    activeTagName === tag.name && styles.navItemActive
                                )}
                            >
                                {/* boton principal, seleccionar tag */}
                                <button
                                    className={styles.tagBtn}
                                    onClick={() => onTagClick(tag.name)}
                                >
                                    <span
                                        className={styles.tagDot}
                                        style={{ backgroundColor: tag.color }}
                                    />
                                    <span className={styles.navItemLabel}>
                                        {tag.name}
                                    </span>
                                    {tag.bookmarkCount > 0 && (
                                        <span className={styles.tagCount}>{tag.bookmarkCount}</span>
                                    )}
                                </button>

                                {/* boton eliminar, aparece en hover */}
                                {onDeleteTag && (
                                <button
                                    className={styles.tagDeleteBtn}
                                    onClick={e => {
                                        e.stopPropagation();
                                        onDeleteTag(tag.id, tag.name);
                                    }}
                                    title={`Eliminar etiqueta ${tag.name}`}
                                    aria-label={`Eliminar etiqueta ${tag.name}`}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                    close
                                    </span>
                                </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </nav>

            {/* footer */}
            <div className={styles.footer}>
                <div className={styles.iconRow}>
                    <NavLink
                        to="/import-export"
                        className={({ isActive }) =>
                            cn(styles.iconBtn, isActive && styles.iconBtnActive)
                        }
                        title="Importar / Exportar"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            import_export
                        </span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            cn(styles.iconBtn, isActive && styles.iconBtnActive)
                        }
                        title="Configuración"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            settings
                        </span>
                    </NavLink>

                    <button
                        className={styles.iconBtn}
                        onClick={logout}
                        title="Cerrar sesión"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            logout
                        </span>
                    </button>
                </div>

                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            person
                        </span>
                    </div>
                    <span className={styles.userName}>{user?.email}</span>
                </div>
            </div>
        </aside>
    );
};

// FolderNavItem con dropdown
interface FolderNavItemProps {
    folder: Folder;
    activeFolderId?: string;
    onFolderClick: (id: string) => void;
    onNewSubfolder?: (parentId: string, parentName: string) => void;
    depth: number;
}

const FolderNavItem = ({
    folder,
    activeFolderId,
    onFolderClick,
    onNewSubfolder,
    depth,
}: FolderNavItemProps) => {
    const isActive = folder.id === activeFolderId;
    const hasChildren = (folder.children?.length ?? 0) > 0;

    // expande si la carpeta activa es descendiente
    const isAncestorOfActive = (f: Folder, targetId?: string): boolean => {
        if (!targetId) return false;
        return f.children?.some(
            child => child.id === targetId || isAncestorOfActive(child, targetId)
        ) ?? false;
    };

    const [isOpen, setIsOpen] = useState(
        () => isActive || isAncestorOfActive(folder, activeFolderId)
    );

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    };

    const handleClick = () => {
        onFolderClick(folder.id);
        // si tiene hijos y esta cerrado, abre al hacer click
        if (hasChildren && !isOpen) setIsOpen(true);
    };

    return (
        <>
            <div
                className={cn(styles.folderRow, isActive && styles.navItemActive)}
                style={{ paddingLeft: `calc(var(--space-sm) + ${depth * 14}px)` }}
            >
                {/* flecha de dropdown, solo si tiene hijos */}
                {hasChildren ? (
                    <button
                        className={styles.chevronBtn}
                        onClick={handleToggle}
                        aria-label={isOpen ? 'Colapsar' : 'Expandir'}
                        tabIndex={-1}
                    >
                        <span className={cn(
                                'material-symbols-outlined',
                                styles.chevron,
                                isOpen && styles.chevronOpen
                            )}
                        >
                        chevron_right
                        </span>
                    </button>
                ) : (
                    // espacio vacio para alinear carpetas sin hijos
                    <span className={styles.chevronPlaceholder} />
                )}

                {/* boton principal, navegar a la carpeta */}
                <button
                    className={styles.folderBtn}
                    onClick={handleClick}
                >
                    <span
                        className={cn('material-symbols-outlined', styles.navItemIcon)}
                        style={{ fontSize: 20 }}
                    >
                        {hasChildren && isOpen ? 'folder_open' : 'folder'}
                    </span>
                    <span className={styles.navItemLabel}>
                        {folder.name}
                        {folder._count.bookmarks > 0 && (
                            <span className={styles.tagCount}>{folder._count.bookmarks}</span>
                        )}
                    </span>
                </button>

                {/* boton + subcarpeta, aparece en hover */}
                {onNewSubfolder && (
                    <button
                        className={cn(styles.sectionAddBtn, styles.folderAddBtn)}
                        onClick={e => {
                            e.stopPropagation();
                            onNewSubfolder(folder.id, folder.name);
                        }}
                        title={`Nueva subcarpeta en ${folder.name}`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        add
                        </span>
                    </button>
                )}
            </div>

            {/* hijos, muestra solo si esta abierto */}
            {hasChildren && isOpen && (
                <div className={styles.folderChildren}>
                    {folder.children.map(child => (
                        <FolderNavItem
                            key={child.id}
                            folder={child}
                            activeFolderId={activeFolderId}
                            onFolderClick={onFolderClick}
                            onNewSubfolder={onNewSubfolder}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </>
    );
};