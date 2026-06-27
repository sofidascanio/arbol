import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Folder } from '@/types';
import { cn } from '@/utils/cn';
import { useTheme } from '@/context/ThemeContext';
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
}

const TAG_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#c084fc'];

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
}: SideNavProps) => {
    const { user, logout } = useAuth();
    const { openPanel } = useTheme();

    // estado de colapso de secciones
    const [foldersOpen, setFoldersOpen] = useState(true);
    const [tagsOpen, setTagsOpen] = useState(true);

    return (
        <aside className={styles.sidebar}>
            {/* marca */}
            <div className={styles.brand}>
                <div className={styles.brandIcon}>
                    <span className="material-symbols-outlined">park</span>
                </div>
                <div className={styles.brandText}>
                    <span className={styles.brandName}>Arbol</span>
                    <span className={styles.brandSub}>Archivo personal</span>
                </div>
            </div>

            {/* navegacion  */}
            <nav className={styles.nav}>
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        cn(styles.navItem, isActive && styles.navItemActive)
                    }
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
                        tags.map((tag, i) => (
                            <button
                                key={tag.id}
                                className={cn(
                                    styles.navItem,
                                    activeTagName === tag.name && styles.navItemActive
                                )}
                                onClick={() => onTagClick(tag.name)}
                            >
                                <span
                                    className={styles.tagDot}
                                    style={{ backgroundColor: TAG_COLORS[i % TAG_COLORS.length] }}
                                />
                                <span className={styles.navItemLabel}>{tag.name}</span>
                                {tag.bookmarkCount > 0 && (
                                    <span className={styles.tagCount}>{tag.bookmarkCount}</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </nav>

            {/* footer */}
            <div className={styles.footer}>
                <NavLink
                    to="/import-export"
                    className={({ isActive }) =>
                        cn(styles.navItem, isActive && styles.navItemActive)
                    }
                    >
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        import_export
                    </span>
                    <span className={styles.navItemLabel}>Importar / Exportar</span>
                </NavLink>

                <button className={styles.navItem} onClick={logout}>
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        logout
                    </span>
                    <span className={styles.navItemLabel}>Cerrar sesión</span>
                </button>

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
                    <span className={styles.navItemLabel}>{folder.name}</span>
                    {folder._count.bookmarks > 0 && (
                        <span className={styles.tagCount}>{folder._count.bookmarks}</span>
                    )}
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