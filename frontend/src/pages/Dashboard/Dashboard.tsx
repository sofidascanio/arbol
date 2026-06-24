import { useState, useCallback, useDeferredValue } from 'react';
import { SideNav } from '@/components/layout/SideNav/SideNav';
import { TopNav, ViewMode } from '@/components/layout/TopNav/TopNav';
import { GalleryView } from './views/GalleryView/GalleryView';
import { ListView } from './views/ListView/ListView';
import { FoldersView } from './views/FoldersView/FoldersView';
import { NewBookmarkModal } from './components/NewBookmarkModal/NewBookmarkModal';
import { useFolders } from '@/hooks/useFolders';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('gallery');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFolderId, setActiveFolderId] = useState<string | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const deferredSearch = useDeferredValue(searchQuery);

    const { folders, createFolder, fetchFolders } = useFolders();

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleFolderClick = useCallback((folderId: string) => {
        setActiveFolderId(folderId);
        setViewMode('gallery');
    }, []);

    const handleNewFolder = useCallback(async () => {
        const name = prompt('Nombre de la nueva carpeta:');
        if (!name?.trim()) return;
        try {
            await createFolder({ name: name.trim() });
        } catch {
            alert('No se pudo crear la carpeta');
        }
    }, [createFolder]);

    const handleAddNew = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleModalSuccess = useCallback(() => {
        // incrementa refreshKey para forzar re-fetch en las vistas
        setRefreshKey(k => k + 1);
        fetchFolders();
    }, [fetchFolders]);

    return (
        <div className={styles.layout}>
            <SideNav
                folders={folders}
                activeFolderId={activeFolderId}
                onFolderClick={handleFolderClick}
                onNewFolder={handleNewFolder}
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
                    {viewMode === 'gallery' && (
                        <GalleryView
                            key={`gallery-${refreshKey}`}
                            searchQuery={deferredSearch}
                            activeFolderId={activeFolderId}
                            onAddNew={handleAddNew}
                        />
                    )}
                    {viewMode === 'list' && (
                        <ListView
                            key={`list-${refreshKey}`}
                            searchQuery={deferredSearch}
                            activeFolderId={activeFolderId}
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
                </main>
            </div>

            {/* modal */}
            <NewBookmarkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                folders={folders}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};