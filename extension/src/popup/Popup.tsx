import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { extApi, ExtApiError } from '../utils/api';
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

// helper: aplanar carpetas para el selector 
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
	const [toast, setToast] = useState<ToastState | null>(null);

	// Form state
	const [title, setTitle] = useState('');
	const [folderId, setFolderId] = useState('');
	const [folderName, setFolderName] = useState('');
	const [tags, setTags] = useState<string[]>(['Diseño', 'Recursos']);
	const [isSaving, setIsSaving] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	// Login state
	const [loginEmail, setLoginEmail] = useState('');
	const [loginPassword, setLoginPassword] = useState('');
	const [loginError, setLoginError] = useState('');
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	// ─── Toast helper ──────────────────────────────────────────────────────────

	const showToast = useCallback((message: string, type: 'success' | 'error') => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3000);
	}, []);

	// ─── Inicialización ────────────────────────────────────────────────────────

	useEffect(() => {
		const init = async () => {
		// 1. Verificar autenticación
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

		// 2. Obtener info de la pestaña activa
		chrome.runtime.sendMessage({ type: 'GET_TAB_INFO' }, (tab: TabInfo) => {
			setTabInfo(tab);
			setTitle(tab.title);
		});

		// 3. Extraer metadatos de la página via content script
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			const tabId = tabs[0]?.id;
			if (!tabId) return;

			chrome.tabs.sendMessage(
			tabId,
			{ type: 'GET_METADATA' },
			(meta: PageMetadata) => {
				if (chrome.runtime.lastError) return; // content script no disponible
				setMetadata(meta);
				if (meta.title && !title) setTitle(meta.title);
			}
			);
		});

		// 4. Cargar carpetas
		try {
			const data = await extApi.getFolders();
			setFolders(data.folders);
		} catch {
			// No bloquear por error de carpetas
		}

		setView('main');
		};

		init();
	}, []); // eslint-disable-line

	// ─── Login ─────────────────────────────────────────────────────────────────

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
		setView('loading');
		// Re-inicializar
		window.location.reload();
		} catch (error) {
		setLoginError(
			error instanceof ExtApiError ? error.message : 'Error al iniciar sesión'
		);
		} finally {
		setIsLoggingIn(false);
		}
	};

	// ─── Guardar marcador ──────────────────────────────────────────────────────

	const handleSave = async () => {
		if (!title.trim() || !tabInfo.url) return;

		setIsSaving(true);
		try {
		await extApi.createBookmark({
			title: title.trim(),
			url: tabInfo.url,
			description: metadata.description,
			folderId: folderId || undefined,
			tagNames: tags.length > 0 ? tags : undefined,
		});

		// Notificar al background para actualizar el badge
		chrome.runtime.sendMessage({ type: 'BOOKMARK_SAVED' });

		showToast('Marcador guardado en tu archivo', 'success');

		// Cerrar popup después de un momento
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

	// ─── Quitar marcador ───────────────────────────────────────────────────────

	const handleRemove = async () => {
		if (!tabInfo.url) return;

		setIsRemoving(true);
		try {
		await extApi.deleteBookmarkByUrl(tabInfo.url);
		showToast('Marcador eliminado', 'error');
		setTimeout(() => window.close(), 1500);
		} catch {
		showToast('No se encontró el marcador para eliminar', 'error');
		} finally {
		setIsRemoving(false);
		}
	};

	const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

	const flatFolders = flattenFolders(folders);
	const selectedFolder = flatFolders.find(f => f.id === folderId);

	// ─── Render: Cargando ──────────────────────────────────────────────────────

	if (view === 'loading') {
		return (
		<div className={styles.popup}>
			<div className={styles.header}>
			<div className={styles.headerLeft}>
				<span className={cn('material-symbols-outlined', styles.headerIcon)}>
				bookmark
				</span>
				<span className={styles.headerTitle}>Bookmark Manager</span>
			</div>
			</div>
			<div className={styles.centerState}>
			<div className={styles.spinner} />
			<p className={styles.stateSub}>Cargando...</p>
			</div>
		</div>
		);
	}

	// ─── Render: Login ─────────────────────────────────────────────────────────

	if (view === 'login') {
		return (
		<div className={styles.popup}>
			<div className={styles.header}>
			<div className={styles.headerLeft}>
				<span className={cn('material-symbols-outlined', styles.headerIcon)}>
				bookmark
				</span>
				<span className={styles.headerTitle}>Bookmark Manager</span>
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
				{isLoggingIn ? (
				<span className={styles.spinner} />
				) : (
				<span className="material-symbols-outlined" style={{ fontSize: 20 }}>
					login
				</span>
				)}
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
					<span className={cn('material-symbols-outlined', styles.headerIcon)}>
						bookmark
					</span>
					<span className={styles.headerTitle}>Arbol</span>
				</div>
				<div className={styles.headerActions}>
					<button
						className={styles.iconBtn}
						title="Configuración"
						onClick={() => chrome.runtime.openOptionsPage?.()}
					>
						<span className="material-symbols-outlined" style={{ fontSize: 18 }}>
						settings
						</span>
					</button>
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

			{/* cuerpo  */}
			<div className={styles.body}>
				{/* vista previa de la página */}
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

				{/* identidad de la pagina */}
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
						<span className={styles.pageNameLabel}>Nombre de la página</span>
						<input
						className={styles.pageNameInput}
						type="text"
						value={title}
						onChange={e => setTitle(e.target.value)}
						placeholder="Ingresá el título del marcador..."
						/>
					</div>
				</div>

				{/* organizacion: carpeta */}
				<div className={styles.orgRow}>
					<div className={styles.fieldGroup}>
						<span className={styles.fieldLabel}>Carpeta</span>
						<div className={styles.fieldInputWrapper}>
							<span className={cn('material-symbols-outlined', styles.fieldIcon)}>
								folder
							</span>
							<input
								className={styles.fieldInput}
								type="text"
								placeholder="Nueva carpeta..."
								value={folderName}
								onChange={e => setFolderName(e.target.value)}
							/>
						</div>
					</div>

					<div className={styles.fieldGroup}>
						<span className={styles.fieldLabel}>Carpeta existente</span>
						<div className={styles.fieldInputWrapper}>
							<select
								className={styles.fieldSelect}
								value={folderId}
								onChange={e => setFolderId(e.target.value)}
							>
								<option value="">Sin carpeta</option>
								{flatFolders.map(f => (
									<option key={f.id} value={f.id}>
										{'  '.repeat(f.depth)}{f.depth > 0 ? '↳ ' : ''}{f.name}
									</option>
								))}
							</select>
							<span className={cn('material-symbols-outlined', styles.selectArrow)}>
								expand_more
							</span>
						</div>
					</div>
				</div>

				{/* tags */}
				<div className={styles.tagsRow}>
					{tags.map(tag => (
						<span key={tag} className={styles.tagChip}>
							<span className={cn('material-symbols-outlined', styles.tagChipIcon)}>
								sell
							</span>
							{tag}
							<button
								className={styles.iconBtn}
								onClick={() => removeTag(tag)}
								style={{ width: 16, height: 16, marginLeft: 2 }}
								aria-label={`Eliminar etiqueta ${tag}`}
							>
								<span className="material-symbols-outlined" style={{ fontSize: 12 }}>
									close
								</span>
							</button>
						</span>
					))}

					<button className={styles.addTagBtn} title="Agregar etiqueta">
						<span className="material-symbols-outlined" style={{ fontSize: 14 }}>
						add
						</span>
					</button>
				</div>
			</div>

			{/* footer */}
			<div className={styles.footer}>
				<button
					className={styles.btnSave}
					onClick={handleSave}
					disabled={isSaving || isRemoving}
				>
					{isSaving ? (
						<span className={styles.spinner} />
					) : (
						<span className="material-symbols-outlined" style={{ fontSize: 20 }}>
						add_circle
						</span>
					)}
					AGREGAR
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

			{/* toast  */}
			{toast && (
				<div className={cn(
					styles.toast,
					toast.type === 'success' ? styles.toastSuccess : styles.toastError
				)}>
					<span className={cn('material-symbols-outlined', styles.toastIcon)}
						style={{ fontSize: 18 }}>
						{toast.type === 'success' ? 'check_circle' : 'error'}
					</span>
					{toast.message}
				</div>
			)}
		</div>
	);
};