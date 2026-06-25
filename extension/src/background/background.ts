import { storage } from '../utils/storage';
import { extApi, ExtApiError } from '../utils/api';

// instalacion 
chrome.runtime.onInstalled.addListener(() => {
    // crea menu contextual al instalar
    chrome.contextMenus.create({
        id: 'save-bookmark',
        title: 'Guardar en Arbol',
        contexts: ['link', 'page'],
    });

    chrome.contextMenus.create({
        id: 'save-link',
        title: 'Guardar este enlace',
        contexts: ['link'],
    });

    // alarma de sincronizacion cada 30 minutos
    chrome.alarms.create('sync-bookmarks', {
        periodInMinutes: 30,
    });

    console.info('[Arbol] Instalada correctamente');
});

// menu contextual 
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const token = await storage.getToken();

    if (!token) {
        // no esta autenticado autenticado, abre popup
        chrome.action.openPopup();
        return;
    }

    let url: string;
    let title: string;

    if (info.menuItemId === 'save-link' && info.linkUrl) {
        url = info.linkUrl;
        title = info.selectionText || new URL(info.linkUrl).hostname;
    } else {
        // guarda la pagina actual
        url = tab?.url ?? info.pageUrl;
        title = tab?.title ?? new URL(url).hostname;
    }

    try {
        await extApi.createBookmark({ title, url });

        // notificacion de exito
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/public/icons/icon-48.png',
            title: 'Marcador guardado',
            message: `"${title}" fue agregado a tu archivo.`,
        });
    } catch (error) {
        const message = error instanceof ExtApiError
            ? error.message
            : 'Error al guardar el marcador';

        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/public/icons/icon-48.png',
            title: 'Error al guardar',
            message,
        });
    }
});

// alarmas (sincronizacion periodica) 
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== 'sync-bookmarks') return;

    const token = await storage.getToken();
    if (!token) return;

    try {
        // verifica que el token sigue siendo valido
        await extApi.me();
        await storage.setLastSync(new Date().toISOString());
        console.info('[Arbol] Sincronización completada');
    } catch {
        // token expirado, limpia auth
        await storage.clearAuth();
        console.info('[Arbol] Token expirado, sesión cerrada');
    }
});

// mensajes desde el popup 
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_TAB_INFO') {
        // el popup pide info de la pestaña activa
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const tab = tabs[0];
            sendResponse({
                url: tab?.url ?? '',
                title: tab?.title ?? '',
                favIconUrl: tab?.favIconUrl ?? '',
            });
        });
        return true; // necesario para respuesta async
    }

    if (message.type === 'BOOKMARK_SAVED') {
        // actualiza badge del icono de la extension
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4ade80' });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '' });
        }, 2000);
    }
});