import { storage } from '../utils/storage';
import { extApi, ExtApiError } from '../utils/api';

// instalacion
chrome.runtime.onInstalled.addListener(() => {
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

    chrome.alarms.create('sync-bookmarks', {
        periodInMinutes: 30,
    });

    console.info('[Arbol] Instalada correctamente');
});

// badge segun si la URL esta guardada 
const updateBadgeForTab = async (tabId: number) => {
    const token = await storage.getToken();
    if (!token) {
        chrome.action.setBadgeText({ text: '', tabId });
        return;
    }

    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
            chrome.action.setBadgeText({ text: '', tabId });
            return;
        }

        const existing = await extApi.getBookmarkByUrl(tab.url);
        if (existing) {
            chrome.action.setBadgeText({ text: '★', tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#21201a', tabId });
        } else {
            chrome.action.setBadgeText({ text: '', tabId });
        }
    } catch {
        chrome.action.setBadgeText({ text: '', tabId });
    }
};

// actualiza badge cuando el usuario cambia de pestaña
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await updateBadgeForTab(activeInfo.tabId);
});

// actualiza badge cuando la pestaña termina de cargar
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        await updateBadgeForTab(tabId);
    }
});

// menu contextual
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const token = await storage.getToken();

    if (!token) {
        chrome.action.openPopup();
        return;
    }

    let url: string;
    let title: string;

    if (info.menuItemId === 'save-link' && info.linkUrl) {
        url = info.linkUrl;
        title = info.selectionText || new URL(info.linkUrl).hostname;
    } else {
        url = tab?.url ?? info.pageUrl;
        title = tab?.title ?? new URL(url).hostname;
    }

    try {
        await extApi.createBookmark({ title, url });

        // actualizar badge de la pestaña actual
        if (tab?.id) await updateBadgeForTab(tab.id);

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
        await extApi.me();
        await storage.setLastSync(new Date().toISOString());
        console.info('[Arbol] Sincronización completada');
    } catch {
        await storage.clearAuth();
        console.info('[Arbol] Token expirado, sesión cerrada');
    }
});

// mensajes desde el popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_TAB_INFO') {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const tab = tabs[0];
            sendResponse({
                url: tab?.url ?? '',
                title: tab?.title ?? '',
                favIconUrl: tab?.favIconUrl ?? '',
            });
        });
        return true;
    }

    if (message.type === 'BOOKMARK_SAVED') {
        // actualiza badge de la pestaña activa
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const tabId = tabs[0]?.id;
            if (tabId) {
                chrome.action.setBadgeText({ text: '★', tabId });
                chrome.action.setBadgeBackgroundColor({ color: '#21201a', tabId });
            }
        });
    }

    if (message.type === 'BOOKMARK_REMOVED') {
        // limpia badge de la pestaña activa
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const tabId = tabs[0]?.id;
            if (tabId) {
                chrome.action.setBadgeText({ text: '', tabId });
            }
        });
    }
});