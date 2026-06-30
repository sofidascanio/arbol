import { useState, useRef, useEffect } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useTags } from '@/hooks/useTags';
import { folderService } from '@/services/folder.service';
import { Folder } from '@/types';
import { InputModal } from '@/components/ui/InputModal/InputModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal/ConfirmModal';
import { useToastContext } from '@/context/ToastContext';
import { tagService } from '@/services/tag.service';
import { cn } from '@/utils/cn';
import styles from './Settings.module.css';

// aplanar arbol de carpetas con profundidad
interface FlatFolder {
    id: string;
    name: string;
    depth: number;
    bookmarkCount: number;
    childCount: number;
}

const flattenFolders = (folders: Folder[], depth = 0): FlatFolder[] =>
    folders.flatMap(f => [
        {
            id: f.id,
            name: f.name,
            depth,
            bookmarkCount: f._count.bookmarks,
            childCount: f.children?.length ?? 0,
        },
        ...flattenFolders(f.children ?? [], depth + 1),
    ]);

export const Settings = () => {
    const { folders, fetchFolders, createFolder, deleteFolder } = useFolders();
    const { tags, fetchTags, deleteTag } = useTags();
    const toast = useToastContext();

    // edicion inline de nombre de carpeta 
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingFolderName, setEditingFolderName] = useState('');
    const folderInputRef = useRef<HTMLInputElement>(null);

    // modal nueva carpeta/subcarpeta 
    const [folderModal, setFolderModal] = useState<{
        isOpen: boolean;
        parentId?: string;
        parentName?: string;
    }>({ isOpen: false });

    // modal nueva etiqueta 
    const [newTagModal, setNewTagModal] = useState(false);

    // modal editar etiqueta 
    const [editTagModal, setEditTagModal] = useState<{
        isOpen: boolean;
        tagId?: string;
        name?: string;
        color?: string;
    }>({ isOpen: false });

    // modal confirmar eliminacion (carpeta o etiqueta) 
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        type?: 'folder' | 'tag';
        id?: string;
        name?: string;
        warning?: string;
    }>({ isOpen: false });

    const flatFolders = flattenFolders(folders);

    useEffect(() => {
        if (editingFolderId) folderInputRef.current?.focus();
    }, [editingFolderId]);

    // carpetas: editar nombre 
    const startEditFolder = (folder: FlatFolder) => {
        setEditingFolderId(folder.id);
        setEditingFolderName(folder.name);
    };

    const saveFolderName = async () => {
        if (!editingFolderId) return;
        const name = editingFolderName.trim();
        if (!name) {
            setEditingFolderId(null);
            return;
        }
        try {
            await folderService.update(editingFolderId, { name });
            await fetchFolders();
            toast.success('Carpeta renombrada');
        } catch {
            toast.error('No se pudo renombrar la carpeta');
        } finally {
            setEditingFolderId(null);
        }
    };

    // carpetas: crear/subcarpeta 
    const handleOpenNewFolder = () => {
        setFolderModal({ isOpen: true });
    };

    const handleOpenNewSubfolder = (folder: FlatFolder) => {
        setFolderModal({ isOpen: true, parentId: folder.id, parentName: folder.name });
    };

    const handleCreateFolder = async (name: string) => {
        await createFolder({ name, parentId: folderModal.parentId });
        toast.success(
        folderModal.parentId
            ? `Subcarpeta "${name}" creada en ${folderModal.parentName}`
            : `Carpeta "${name}" creada`
        );
    };

    // carpetas: eliminar 
    const handleOpenDeleteFolder = (folder: FlatFolder) => {
        const warning = folder.childCount > 0
            ? `Esta carpeta tiene ${folder.childCount} subcarpeta(s). Se eliminarán también. Los marcadores quedarán sin carpeta.`
            : 'Los marcadores dentro de esta carpeta quedarán sin carpeta.';

        setDeleteModal({
            isOpen: true,
            type: 'folder',
            id: folder.id,
            name: folder.name,
            warning,
        });
    };

    // etiquetas: editar 
    const handleOpenEditTag = (tagId: string, name: string, color: string) => {
        setEditTagModal({ isOpen: true, tagId, name, color });
    };

    const handleSaveTagEdit = async (newName: string, newColor?: string) => {
        if (!editTagModal.tagId) return;

        if (newName !== editTagModal.name) {
            await tagService.renameTag(editTagModal.tagId, newName);
        }
        if (newColor && newColor !== editTagModal.color) {
            await tagService.updateColor(editTagModal.tagId, newColor);
        }

        await fetchTags();
        toast.success('Etiqueta actualizada');
    };

    const handleCreateTag = async (name: string, color?: string) => {
        await tagService.createTag(name, color ?? '#60a5fa');
        await fetchTags();
        toast.success(`Etiqueta "${name}" creada`);
    };

    // etiquetas: eliminar 
    const handleOpenDeleteTag = (tagId: string, tagName: string) => {
        setDeleteModal({
            isOpen: true,
            type: 'tag',
            id: tagId,
            name: tagName,
            warning: 'Se quitará de todos tus marcadores.',
        });
    };

    // confirmar eliminacion (generico) 
    const handleConfirmDelete = async () => {
        if (!deleteModal.id || !deleteModal.type) return;

        if (deleteModal.type === 'folder') {
            await deleteFolder(deleteModal.id);
            toast.success(`Carpeta "${deleteModal.name}" eliminada`);
        } else {
            await deleteTag(deleteModal.id);
            toast.success(`Etiqueta "${deleteModal.name}" eliminada`);
        }
    };

    return (
        <div className={styles.page}>
            {/* encabezado  */}
            <div className={styles.header}>
                <h1 className={styles.title}>Configuración</h1>
                <p className={styles.subtitle}>
                Gestiona tus carpetas y etiquetas desde un solo lugar.
                </p>
            </div>

            {/* grid de dos columnas: Carpetas | Etiquetas  */}
            <div className={styles.sectionsGrid}>

                {/* columna izquierda: carpetas  */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionHeaderLeft}>
                        <div className={styles.sectionIcon}>
                            <span className="material-symbols-outlined">folder</span>
                        </div>
                        <div>
                            <div className={styles.sectionTitle}>Carpetas</div>
                            <div className={styles.sectionSub}>
                            {flatFolders.length} {flatFolders.length === 1 ? 'carpeta' : 'carpetas'}
                            </div>
                        </div>
                        </div>
                        <button className={styles.addBtn} onClick={handleOpenNewFolder}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                        Nueva
                        </button>
                    </div>

                    <div className={styles.sectionBody}>
                        {flatFolders.length === 0 ? (
                        <div className={styles.empty}>Todavía no creaste ninguna carpeta</div>
                        ) : (
                        flatFolders.map(folder => (
                            <div key={folder.id} className={styles.row}>
                            <span
                                className={cn('material-symbols-outlined', styles.rowIcon)}
                                style={{ marginLeft: folder.depth * 20 }}
                            >
                                {folder.depth > 0 ? 'subdirectory_arrow_right' : 'folder'}
                            </span>

                            {editingFolderId === folder.id ? (
                                <input
                                ref={folderInputRef}
                                className={styles.editInput}
                                value={editingFolderName}
                                onChange={e => setEditingFolderName(e.target.value)}
                                onBlur={saveFolderName}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') saveFolderName();
                                    if (e.key === 'Escape') setEditingFolderId(null);
                                }}
                                />
                            ) : (
                                <span className={styles.rowName}>{folder.name}</span>
                            )}

                            <span className={styles.rowMeta}>
                                {folder.bookmarkCount} {folder.bookmarkCount === 1 ? 'marcador' : 'marcadores'}
                            </span>

                            <div className={styles.rowActions}>
                                <button
                                className={styles.rowActionBtn}
                                onClick={() => handleOpenNewSubfolder(folder)}
                                title={`Nueva subcarpeta en ${folder.name}`}
                                >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                    create_new_folder
                                </span>
                                </button>
                                <button
                                className={styles.rowActionBtn}
                                onClick={() => startEditFolder(folder)}
                                title="Renombrar"
                                >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                    edit
                                </span>
                                </button>
                                <button
                                className={cn(styles.rowActionBtn, styles.rowActionBtnDanger)}
                                onClick={() => handleOpenDeleteFolder(folder)}
                                title="Eliminar"
                                >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                    delete
                                </span>
                                </button>
                            </div>
                            </div>
                        ))
                        )}
                    </div>
                </div>

                {/* columna derecha: etiquetas  */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionHeaderLeft}>
                        <div className={styles.sectionIcon}>
                            <span className="material-symbols-outlined">sell</span>
                        </div>
                        <div>
                            <div className={styles.sectionTitle}>Etiquetas</div>
                            <div className={styles.sectionSub}>
                            {tags.length} {tags.length === 1 ? 'etiqueta' : 'etiquetas'}
                            </div>
                        </div>
                        </div>
                        <button className={styles.addBtn} onClick={() => setNewTagModal(true)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                        Nueva
                        </button>
                    </div>

                    <div className={styles.sectionBody}>
                        {tags.length === 0 ? (
                            <div className={styles.empty}>Todavía no creaste ninguna etiqueta</div>
                        ) : (
                            tags.map(tag => (
                                <div key={tag.id} className={styles.row}>
                                    <span
                                        className={styles.tagDot}
                                        style={{ backgroundColor: tag.color }}
                                    />

                                    <span className={styles.rowName}>{tag.name}</span>

                                    <span className={styles.rowMeta}>
                                        {tag.bookmarkCount} {tag.bookmarkCount === 1 ? 'marcador' : 'marcadores'}
                                    </span>

                                    <div className={styles.rowActions}>
                                        <button
                                            className={styles.rowActionBtn}
                                            onClick={() => handleOpenEditTag(tag.id, tag.name, tag.color)}
                                            title="Editar etiqueta"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                                edit
                                            </span>
                                        </button>
                                        <button
                                            className={cn(styles.rowActionBtn, styles.rowActionBtnDanger)}
                                            onClick={() => handleOpenDeleteTag(tag.id, tag.name)}
                                            title="Eliminar"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                                delete
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            <InputModal
                isOpen={folderModal.isOpen}
                onClose={() => setFolderModal({ isOpen: false })}
                onConfirm={handleCreateFolder}
                title={folderModal.parentId ? 'Nueva subcarpeta' : 'Nueva carpeta'}
                subtitle={
                folderModal.parentId
                    ? `Dentro de "${folderModal.parentName}"`
                    : 'Organizá tus marcadores'
                }
                icon="create_new_folder"
                label="Nombre de la carpeta"
                placeholder="Ej: Diseño, Trabajo, Recursos..."
                confirmLabel="Crear carpeta"
                previewIcon="folder"
                parentName={folderModal.parentName}
            />

            <InputModal
                isOpen={newTagModal}
                onClose={() => setNewTagModal(false)}
                onConfirm={handleCreateTag}
                title="Nueva etiqueta"
                subtitle="Las etiquetas ayudan a clasificar tus marcadores"
                icon="sell"
                label="Nombre de la etiqueta"
                placeholder="Ej: diseño, frontend, inspiración..."
                confirmLabel="Crear etiqueta"
                previewIcon="sell"
                showColorPicker
            />

            <InputModal
                isOpen={editTagModal.isOpen}
                onClose={() => setEditTagModal({ isOpen: false })}
                onConfirm={handleSaveTagEdit}
                title="Editar etiqueta"
                subtitle="Modificá el nombre o el color"
                icon="edit"
                label="Nombre de la etiqueta"
                placeholder="Ej: diseño, frontend..."
                confirmLabel="Guardar cambios"
                previewIcon="sell"
                showColorPicker
                initialValue={editTagModal.name}
                initialColor={editTagModal.color}
            />

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={deleteModal.type === 'folder' ? 'Eliminar carpeta' : 'Eliminar etiqueta'}
                message={`¿Estas seguro de que queres eliminar "${deleteModal.name}"? Esta acción no se puede deshacer.`}
                warning={deleteModal.warning}
                confirmLabel="Sí, eliminar"
            />
        </div>
    );
};