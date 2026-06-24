import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Folder } from '@/types';
import { cn } from '@/utils/cn';
import { useTheme } from '@/context/ThemeContext';
import styles from './SideNav.module.css';

interface SideNavProps {
    folders: Folder[];
    activeFolderId?: string;
    onFolderClick: (folderId: string) => void;
    onNewFolder: () => void;
}

const TAG_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#c084fc'];

export const SideNav = ({
    folders,
    activeFolderId,
    onFolderClick,
    onNewFolder,
}: SideNavProps) => {
    const { user, logout } = useAuth();

    // Extraer tags únicos de las carpetas para mostrar en sidebar
    const mainNavItems = [
        { icon: 'bookmark', label: 'Todos los marcadores', path: '/' },
        { icon: 'star', label: 'Favoritos', path: '/favorites' },
    ];

    const folderNavItems = [
        { icon: 'work', label: 'Work' },
        { icon: 'person', label: 'Personal' },
        { icon: 'lightbulb', label: 'Inspiration' },
    ];

    const { openPanel } = useTheme();

    return (
        <aside className={styles.sidebar}>
            {/* marca  */}
            <div className={styles.brand}>
                <div className={styles.brandIcon}>
                    <span className="material-symbols-outlined">account_tree</span>
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
                    {folders.length > 0 && (
                    <>
                        <span className={styles.sectionLabel}>Carpetas</span>
                        {folders.map(folder => (
                            <FolderNavItem
                                key={folder.id}
                                folder={folder}
                                activeFolderId={activeFolderId}
                                onFolderClick={onFolderClick}
                                depth={0}
                            />
                        ))}
                    </>
                )}

                {/* tags de ejemplo  */}
                <span className={styles.sectionLabel}>Etiquetas</span>
                {['Diseño', 'Ingeniería', 'Recursos', 'Inspiración'].map((tag, i) => (
                    <button key={tag} className={styles.navItem}>
                        <span
                        className={styles.tagDot}
                        style={{ backgroundColor: TAG_COLORS[i] }}
                        />
                        <span className={styles.navItemLabel}>{tag}</span>
                    </button>
                ))}
            </nav>

            {/* footer  */}
            <div className={styles.footer}>
                <button className={styles.navItem} onClick={openPanel}>
                    <span className={cn('material-symbols-outlined', styles.navItemIcon)}>
                        palette
                    </span>
                    <span className={styles.navItemLabel}>Apariencia</span>
                </button>
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
    depth: number;
}

const FolderNavItem = ({
    folder,
    activeFolderId,
    onFolderClick,
    depth,
}: FolderNavItemProps) => {
    const isActive = folder.id === activeFolderId;

    return (
        <>
        <button
            className={cn(styles.navItem, isActive && styles.navItemActive)}
            style={{ paddingLeft: `calc(var(--space-sm) + ${depth * 16}px)` }}
            onClick={() => onFolderClick(folder.id)}
        >
            <span className={cn('material-symbols-outlined', styles.navItemIcon)}
            style={{ fontSize: 20 }}>
            {folder.children?.length > 0 ? 'folder_open' : 'folder'}
            </span>
            <span className={styles.navItemLabel}>{folder.name}</span>
            {folder._count.bookmarks > 0 && (
            <span style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--on-surface-variant)',
                marginLeft: 'auto',
            }}>
                {folder._count.bookmarks}
            </span>
            )}
        </button>

        {folder.children?.map(child => (
            <FolderNavItem
            key={child.id}
            folder={child}
            activeFolderId={activeFolderId}
            onFolderClick={onFolderClick}
            depth={depth + 1}
            />
        ))}
        </>
    );
};