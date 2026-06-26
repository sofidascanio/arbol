import { NavLink } from 'react-router-dom';
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
    onNewSubfolder
}: SideNavProps) => {
    const { user, logout } = useAuth();

    const { openPanel } = useTheme();

    return (
        <aside className={styles.sidebar}>
            {/* marca  */}
            <div className={styles.brand}>
                <div className={styles.brandIcon}>
                    <span className="material-symbols-outlined">park</span>
                </div>
                <div className={styles.brandText}>
                    <span className={styles.brandName}>Arbol</span>
                    <span className={styles.brandSub}>Archivo personal</span>
                </div>
            </div>

            {/* boton nueva carpeta */}
            <button className={styles.newFolderBtn} onClick={onNewFolder}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                Nueva carpeta
            </button>

            {/* navegacion principal  */}
            <nav className={styles.nav}>
                <NavLink to="/"
                        end
                        className={({ isActive }) =>
                            cn(styles.navItem, isActive && styles.navItemActive)
                        }>
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        bookmark
                    </span>
                    <span className={styles.navItemLabel}>Todos los marcadores</span>
                </NavLink>

                <NavLink to="/favorites"
                        className={({ isActive }) =>
                            cn(styles.navItem, isActive && styles.navItemActive)
                        }>
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        star
                    </span>
                    <span className={styles.navItemLabel}>Favoritos</span>
                </NavLink>

                {/* carpetas dinamicas  */}
                <div className={styles.sectionRow}>
                    <span className={styles.sectionLabel}>Carpetas</span>
                    <button
                        className={styles.sectionAddBtn}
                        onClick={onNewFolder}
                        title="Nueva carpeta"
                        aria-label="Nueva carpeta"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        add
                        </span>
                    </button>
                </div>

                {folders.map(folder => (
                    <FolderNavItem
                        key={folder.id}
                        folder={folder}
                        activeFolderId={activeFolderId}
                        onFolderClick={onFolderClick}
                        onNewSubfolder={(parentId, parentName) =>
                            onNewSubfolder?.(parentId, parentName)
                        }
                        depth={0}
                    />
                ))}

                {/* tags de ejemplo  */}
                <div className={styles.sectionRow}>
                    <span className={styles.sectionLabel}>Etiquetas</span>
                    <button
                        className={styles.sectionAddBtn}
                        onClick={onNewTag}
                        title="Nueva etiqueta"
                        aria-label="Nueva etiqueta"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        add
                        </span>
                    </button>
                </div>

                {tags.length === 0 ? (
                    <span style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--on-surface-variant)',
                        padding: 'var(--space-xs) var(--space-sm)',
                        opacity: 0.6,
                    }}>
                        Sin etiquetas todavía
                    </span>
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
                            <span style={{
                                fontSize: 'var(--font-size-caption)',
                                color: 'var(--on-surface-variant)',
                                marginLeft: 'auto',
                            }}>
                            {tag.bookmarkCount}
                            </span>
                        )}
                        </button>
                    ))
                )}

            </nav>

            {/* footer  */}
            <div className={styles.footer}>
                <button className={styles.navItem} onClick={openPanel}>
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        palette
                    </span>
                    <span className={styles.navItemLabel}>Apariencia</span>
                </button>
                <NavLink to="/import-export"
                    className={({ isActive }) =>
                        cn(styles.navItem, isActive && styles.navItemActive)
                    }
                >
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        import_export
                    </span>
                    <span className={styles.navItemLabel}>Importar / Exportar</span>
                </NavLink>
                <button className={styles.navItem}>
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        settings
                    </span>
                    <span className={styles.navItemLabel}>Configuración</span>
                </button>

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

// item de carpeta recursivo 
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

    return (
        <>
            <div className={cn(styles.folderRow, isActive && styles.navItemActive)}>
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)',
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'inherit',
                        font: 'inherit',
                        padding: 0,
                        minWidth: 0,
                    }}
                    onClick={() => onFolderClick(folder.id)}
                >
                <span
                    className={cn('material-symbols-outlined', styles.navItemIcon)}
                    style={{ fontSize: 20 }}
                >
                    {folder.children?.length > 0 ? 'folder_open' : 'folder'}
                </span>
                <span className={styles.navItemLabel}>{folder.name}</span>
                {folder._count.bookmarks > 0 && (
                    <span style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--on-surface-variant)',
                        marginLeft: 'auto',
                        paddingRight: 'var(--space-xs)',
                    }}>
                        {folder._count.bookmarks}
                    </span>
                )}
                </button>

                {/* boton + para subcarpeta, aparece en hover */}
                {onNewSubfolder && (
                    <button
                        className={styles.sectionAddBtn}
                        onClick={e => {
                            e.stopPropagation();
                            onNewSubfolder(folder.id, folder.name);
                        }}
                        title={`Nueva subcarpeta en ${folder.name}`}
                        aria-label={`Nueva subcarpeta en ${folder.name}`}
                        style={{ marginRight: 'var(--space-xs)', opacity: undefined }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        add
                        </span>
                    </button>
                )}
            </div>

            {folder.children?.map(child => (
                <FolderNavItem
                    key={child.id}
                    folder={child}
                    activeFolderId={activeFolderId}
                    onFolderClick={onFolderClick}
                    onNewSubfolder={onNewSubfolder}
                    depth={depth + 1}
                />
            ))}
        </>
    );
};
