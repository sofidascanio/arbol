//#region src/utils/storage.ts
var KEYS = {
	TOKEN: "bm_token",
	USER: "bm_user",
	API_URL: "bm_api_url",
	LAST_SYNC: "bm_last_sync"
};
var get = (key) => {
	return new Promise((resolve) => {
		chrome.storage.local.get(key, (result) => {
			resolve(result[key] ?? null);
		});
	});
};
var set = (key, value) => {
	return new Promise((resolve) => {
		chrome.storage.local.set({ [key]: value }, resolve);
	});
};
var remove = (key) => {
	return new Promise((resolve) => {
		chrome.storage.local.remove(key, resolve);
	});
};
var storage = {
	getToken: () => get(KEYS.TOKEN),
	setToken: (token) => set(KEYS.TOKEN, token),
	removeToken: () => remove(KEYS.TOKEN),
	getUser: () => get(KEYS.USER),
	setUser: (user) => set(KEYS.USER, user),
	removeUser: () => remove(KEYS.USER),
	getApiUrl: async () => {
		return await get(KEYS.API_URL) ?? "http://localhost:3000/api";
	},
	setApiUrl: (url) => set(KEYS.API_URL, url),
	getLastSync: () => get(KEYS.LAST_SYNC),
	setLastSync: (date) => set(KEYS.LAST_SYNC, date),
	clearAuth: async () => {
		await remove(KEYS.TOKEN);
		await remove(KEYS.USER);
	}
};
//#endregion
//#region src/utils/api.ts
var ExtApiError = class extends Error {
	message;
	status;
	constructor(message, status) {
		super(message);
		this.message = message;
		this.status = status;
	}
};
var request = async (endpoint, options = {}) => {
	const [token, apiUrl] = await Promise.all([storage.getToken(), storage.getApiUrl()]);
	const headers = {
		"Content-Type": "application/json",
		...token && { Authorization: `Bearer ${token}` },
		...options.headers
	};
	const response = await fetch(`${apiUrl}${endpoint}`, {
		...options,
		headers
	});
	const json = await response.json();
	if (!response.ok || !json.success) throw new ExtApiError(json.message ?? "Error en el servidor", response.status);
	return json.data;
};
var extApi = {
	login: (email, password) => request("/auth/login", {
		method: "POST",
		body: JSON.stringify({
			email,
			password
		})
	}),
	me: () => request("/auth/me"),
	getFolders: () => request("/folders"),
	createBookmark: (data) => request("/bookmarks", {
		method: "POST",
		body: JSON.stringify(data)
	}),
	deleteBookmarkByUrl: async (url) => {
		const match = (await request(`/bookmarks?search=${encodeURIComponent(url)}&limit=5`)).items.find((b) => b.url === url);
		if (match) await request(`/bookmarks/${match.id}`, { method: "DELETE" });
	}
};
//#endregion
export { extApi as n, storage as r, ExtApiError as t };
