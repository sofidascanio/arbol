import { useState, useCallback, useDeferredValue } from 'react';
import { SideNav } from '@/components/layout/SideNav/SideNav';
import { TopNav, ViewMode } from '@/components/layout/TopNav/TopNav';
import { GalleryView } from './views/GalleryView/GalleryView';
import { ListView } from './views/ListView/ListView';
import { FoldersView } from './views/FoldersView/FoldersView';
import { useFolders } from '@/hooks/useFolders';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('gallery');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFolderId, setActiveFolderId] = useState<string | undefined>();
    const deferredSearch = useDeferredValue(searchQuery);

    const { folders, createFolder } = useFolders();

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
        alert('Modal de nuevo marcador');
    }, []);

    return (
        <div className={styles.layout}>
            {/* sidebar  */}
            <SideNav
                folders={folders}
                activeFolderId={activeFolderId}
                onFolderClick={handleFolderClick}
                onNewFolder={handleNewFolder}
            />

            {/* contenido principal  */}
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
                            searchQuery={deferredSearch}
                            activeFolderId={activeFolderId}
                            onAddNew={handleAddNew}
                        />
                    )}
                    {viewMode === 'list' && (
                        <ListView
                            searchQuery={deferredSearch}
                            activeFolderId={activeFolderId}
                            onAddNew={handleAddNew}
                        />
                    )}
                    {viewMode === 'folders' && (
                        <FoldersView
                            searchQuery={deferredSearch}
                            onAddNew={handleAddNew}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};