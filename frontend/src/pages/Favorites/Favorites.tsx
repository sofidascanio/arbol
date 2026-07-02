import { useState, useCallback, useDeferredValue } from 'react';
import { GalleryView } from '@/pages/Dashboard/views/GalleryView/GalleryView';
import { ListView } from '@/pages/Dashboard/views/ListView/ListView';
import { ViewMode } from '@/components/layout/TopNav/TopNav';
import { EditBookmarkModal } from '@/pages/Dashboard/components/EditBookmarkModal/EditBookmarkModal';
import { useFolders } from '@/hooks/useFolders';
import { useToastContext } from '@/context/ToastContext';
import { bookmarkService } from '@/services/bookmark.service';
import { Bookmark } from '@/types';
import { SortState } from '@/types/sort';
import { useSortContext } from '@/context/SortContext';
import styles from './Favorites.module.css';

export const Favorites = () => {
	const [viewMode, setViewMode] = useState<ViewMode>('gallery');
	const [searchQuery, setSearchQuery] = useState('');
	const deferredSearch = useDeferredValue(searchQuery);
	const [refreshKey, setRefreshKey] = useState(0);
	const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

	const { folders } = useFolders();
	const toast = useToastContext();

	const { sortState } = useSortContext();

	const handleSearch = useCallback((q: string) => setSearchQuery(q), []);
	const handleAddNew = useCallback(() => {
		window.location.href = '/';
	}, []);

	const handleEdit = useCallback((bookmark: Bookmark) => {
		setEditingBookmark(bookmark);
	}, []);

	const handleEditSuccess = useCallback(() => {
		setRefreshKey(k => k + 1);
	}, []);

	const handleDelete = useCallback(async (id: string) => {
		if (!confirm('¿Eliminar este marcador?')) return;
		try {
			await bookmarkService.delete(id);
			setRefreshKey(k => k + 1);
			toast.success('Marcador eliminado');
		} catch {
			toast.error('No se pudo eliminar el marcador');
		}
	}, [toast]);

	return (
		<div className={styles.wrapper}>
			{/* TopNav propio para esta seccion */}
			<div className={styles.header}>
				<div className={styles.titleRow}>
				<span
					className="material-symbols-outlined"
				>
					star
				</span>
				<h1 className={styles.title}>Favoritos</h1>
				</div>
				<p className={styles.subtitle}>
				Tus marcadores destacados en un solo lugar.
				</p>
			</div>

			{/* tabs de vista */}
			<div className={styles.viewTabs}>
				{([
					{ key: 'gallery', label: 'Galería', icon: 'grid_view' },
					{ key: 'list', label: 'Lista', icon: 'list' },
				] as { key: ViewMode; label: string; icon: string }[]
				).map(tab => (
					<button
						key={tab.key}
						className={`${styles.viewTab} ${
							viewMode === tab.key ? styles.viewTabActive : ''
						}`}
						onClick={() => setViewMode(tab.key)}
					>
						<span
							className="material-symbols-outlined"
							style={{ fontSize: 18 }}
						>
							{tab.icon}
						</span>
						{tab.label}
					</button>
				))}

				{/* busqueda */}
				<div className={styles.searchWrapper}>
					<span
						className="material-symbols-outlined"
						style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}
					>
						search
					</span>
					<input
						className={styles.searchInput}
						placeholder="Buscar en favoritos..."
						value={searchQuery}
						onChange={e => handleSearch(e.target.value)}
					/>
				</div>
			</div>

			{/* vista, reutiliza GalleryView y ListView con favoritesOnly */}
			<div className={styles.content}>
				{viewMode === 'gallery' && (
					<GalleryView
						key={`fav-gallery-${refreshKey}`}
						searchQuery={deferredSearch}
						onAddNew={handleAddNew}
						onEdit={handleEdit}
						favoritesOnly
						hideAddNew
						sortState={sortState}
					/>
				)}
				{viewMode === 'list' && (
					<ListView
						key={`fav-list-${refreshKey}`}
						searchQuery={deferredSearch}
						onAddNew={handleAddNew}
						onEdit={handleEdit}
						onDelete={handleDelete}
						favoritesOnly
						hideAddNew
						sortState={sortState}
					/>
				)}
			</div>

			<EditBookmarkModal
				isOpen={editingBookmark !== null}
				onClose={() => setEditingBookmark(null)}
				bookmark={editingBookmark}
				folders={folders}
				onSuccess={handleEditSuccess}
			/>
		</div>
	);
};