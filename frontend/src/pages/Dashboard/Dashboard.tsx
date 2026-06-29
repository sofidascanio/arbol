import { useState, useCallback, useDeferredValue } from 'react';
import { SideNav } from '@/components/layout/SideNav/SideNav';
import { TopNav, ViewMode } from '@/components/layout/TopNav/TopNav';
import { GalleryView } from './views/GalleryView/GalleryView';
import { ListView } from './views/ListView/ListView';
import { FoldersView } from './views/FoldersView/FoldersView';
import { NewBookmarkModal } from './components/NewBookmarkModal/NewBookmarkModal';
import { useFolders } from '@/hooks/useFolders';
import { useTags } from '@/hooks/useTags';
import { InputModal } from '@/components/ui/InputModal/InputModal';
import { useToastContext } from '@/context/ToastContext';
// import { folderService } from '@/services/folder.service';
import { tagService } from '@/services/tag.service';
import styles from './Dashboard.module.css';


interface DashboardProps {
    children?: React.ReactNode;
}

export const Dashboard = ({ children }: DashboardProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('gallery');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFolderId, setActiveFolderId] = useState<string | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const deferredSearch = useDeferredValue(searchQuery);

    const toast = useToastContext();

    const [folderModal, setFolderModal] = useState<{
        isOpen: boolean;
        parentId?: string;
        parentName?: string;
    }>({ isOpen: false });

    const [tagModal, setTagModal] = useState(false);

    const { folders, createFolder, fetchFolders } = useFolders();
    const { tags, fetchTags } = useTags();

    const [activeTagName, setActiveTagName] = useState<string | undefined>();

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleFolderClick = useCallback((folderId: string) => {
        setActiveFolderId(folderId);
        setActiveTagName(undefined);
        setViewMode('gallery');
    }, []);

    const handleClearActive = useCallback(() => {
        setActiveFolderId(undefined);
        setActiveTagName(undefined);
    }, []);

    const handleTagClick = useCallback((tagName: string) => {
        // si hace click en el tag activo, lo deselecciona
        setActiveTagName(prev => prev === tagName ? undefined : tagName);
        setActiveFolderId(undefined); // limpia carpeta activa
        setViewMode('gallery');
    }, []);

    const handleNewFolder = useCallback(() => {
        setFolderModal({ isOpen: true });
    }, []);

    const handleNewSubfolder = useCallback((parentId: string, parentName: string) => {
        setFolderModal({ isOpen: true, parentId, parentName });
    }, []);

    const handleNewTag = useCallback(() => {
        setTagModal(true);
    }, []);

    const handleCreateFolder = useCallback(async (name: string) => {
        await createFolder({
            name,
            parentId: folderModal.parentId,
        });
        await fetchFolders();
        toast.success(
            folderModal.parentId
            ? `Subcarpeta "${name}" creada en ${folderModal.parentName}`
            : `Carpeta "${name}" creada`
        );
    }, [createFolder, fetchFolders, folderModal, toast]);

    const handleCreateTag = useCallback(async (name: string, color?: string) => {
        try {
            await tagService.createTag(name, color ?? '#60a5fa');
            await fetchTags(); // refresca el listado del sidebar
            toast.success(`Etiqueta "${name}" creada`);
        } catch {
            toast.error('No se pudo crear la etiqueta');
        }
    }, [fetchTags, toast]);


    const handleAddNew = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleModalSuccess = useCallback(() => {
        // incrementa refreshKey para forzar re-fetch en las vistas
        setRefreshKey(k => k + 1);
        fetchFolders();
    }, [fetchFolders]);

    const handleDeleteTag = useCallback(async (tagId: string, tagName: string) => {
        if (!confirm(`¿Eliminar la etiqueta "${tagName}"?\nSe quitará de todos tus marcadores.`)) return;
        try {
            await tagService.deleteTag(tagId);
            await fetchTags();
            // si el tag eliminado era el activo, limpia el filtro
            if (activeTagName === tagName) {
                setActiveTagName(undefined);
            }
            toast.success(`Etiqueta "${tagName}" eliminada`);
        } catch {
            toast.error('No se pudo eliminar la etiqueta');
        }
    }, [fetchTags, activeTagName, toast]);

    return (
        <div className={styles.layout}>
            <SideNav
                folders={folders}
                tags={tags} 
                activeFolderId={activeFolderId}
                activeTagName={activeTagName} 
                onFolderClick={handleFolderClick}
                onTagClick={handleTagClick} 
                onNewFolder={handleNewFolder}
                onNewTag={handleNewTag}
                onNewSubfolder={handleNewSubfolder}
                onClearActive={handleClearActive}
                onDeleteTag={handleDeleteTag}
            />

            <div className={styles.main}>
                <TopNav
                    viewMode={viewMode}
                    onViewChange={setViewMode}
                    onSearch={handleSearch}
                    searchValue={searchQuery}
                    onAddNew={handleAddNew}
                />

                <main className={styles.content}>
                    {children ?? ( 
                        <> 
                            {viewMode === 'gallery' && (
                                <GalleryView
                                    key={`gallery-${refreshKey}`}
                                    searchQuery={deferredSearch}
                                    activeFolderId={activeFolderId}
                                    activeTagName={activeTagName}
                                    onAddNew={handleAddNew}
                                />
                            )}
                            {viewMode === 'list' && (
                                <ListView
                                    key={`list-${refreshKey}`}
                                    searchQuery={deferredSearch}
                                    activeFolderId={activeFolderId}
                                    activeTagName={activeTagName}
                                    onAddNew={handleAddNew}
                                />
                            )}
                            {viewMode === 'folders' && (
                                <FoldersView
                                    key={`folders-${refreshKey}`}
                                    searchQuery={deferredSearch}
                                    onAddNew={handleAddNew}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* modal */}
            <NewBookmarkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                folders={folders}
                onSuccess={handleModalSuccess}
            />

            {/* modal nueva carpeta/subcarpeta  */}
            <InputModal
                isOpen={folderModal.isOpen}
                onClose={() => setFolderModal({ isOpen: false })}
                onConfirm={handleCreateFolder}
                title={folderModal.parentId ? 'Nueva subcarpeta' : 'Nueva carpeta'}
                subtitle={
                    folderModal.parentId
                    ? `Dentro de ${folderModal.parentName}`
                    : 'Organizá tus marcadores'
                }
                icon="create_new_folder"
                label="Nombre de la carpeta"
                placeholder="Ej: Diseño, Trabajo, Recursos..."
                confirmLabel="Crear carpeta"
                previewIcon="folder"
                parentName={folderModal.parentName}
            />

            {/* modal nueva etiqueta  */}
            <InputModal
                isOpen={tagModal}
                onClose={() => setTagModal(false)}
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
        </div>
    );
};