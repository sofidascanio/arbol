import { n as extApi, r as storage, t as ExtApiError } from "../chunks/api-BkZxn5xp.js";
//#region src/background/background.ts
chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "save-bookmark",
		title: "Guardar en Arbol",
		contexts: ["link", "page"]
	});
	chrome.contextMenus.create({
		id: "save-link",
		title: "Guardar este enlace",
		contexts: ["link"]
	});
	chrome.alarms.create("sync-bookmarks", { periodInMinutes: 30 });
	console.info("[Arbol] Instalada correctamente");
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (!await storage.getToken()) {
		chrome.action.openPopup();
		return;
	}
	let url;
	let title;
	if (info.menuItemId === "save-link" && info.linkUrl) {
		url = info.linkUrl;
		title = info.selectionText || new URL(info.linkUrl).hostname;
	} else {
		url = tab?.url ?? info.pageUrl;
		title = tab?.title ?? new URL(url).hostname;
	}
	try {
		await extApi.createBookmark({
			title,
			url
		});
		chrome.notifications.create({
			type: "basic",
			iconUrl: "/public/icons/icon-48.png",
			title: "Marcador guardado",
			message: `"${title}" fue agregado a tu archivo.`
		});
	} catch (error) {
		const message = error instanceof ExtApiError ? error.message : "Error al guardar el marcador";
		chrome.notifications.create({
			type: "basic",
			iconUrl: "/public/icons/icon-48.png",
			title: "Error al guardar",
			message
		});
	}
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name !== "sync-bookmarks") return;
	if (!await storage.getToken()) return;
	try {
		await extApi.me();
		await storage.setLastSync((/* @__PURE__ */ new Date()).toISOString());
		console.info("[Arbol] Sincronización completada");
	} catch {
		await storage.clearAuth();
		console.info("[Arbol] Token expirado, sesión cerrada");
	}
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "GET_TAB_INFO") {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, (tabs) => {
			const tab = tabs[0];
			sendResponse({
				url: tab?.url ?? "",
				title: tab?.title ?? "",
				favIconUrl: tab?.favIconUrl ?? ""
			});
		});
		return true;
	}
	if (message.type === "BOOKMARK_SAVED") {
		chrome.action.setBadgeText({ text: "✓" });
		chrome.action.setBadgeBackgroundColor({ color: "#4ade80" });
		setTimeout(() => {
			chrome.action.setBadgeText({ text: "" });
		}, 2e3);
	}
});
//#endregion
