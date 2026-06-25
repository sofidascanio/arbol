// claves de almacenamiento
const KEYS = {
    TOKEN: 'bm_token',
    USER: 'bm_user',
    API_URL: 'bm_api_url',
    LAST_SYNC: 'bm_last_sync',
} as const;

interface StoredUser {
    id: string;
    email: string;
}

// helpers 
const get = <T>(key: string): Promise<T | null> => {
    return new Promise(resolve => {
        chrome.storage.local.get(key, result => {
            resolve(result[key] ?? null);
        });
    });
};

const set = (key: string, value: unknown): Promise<void> => {
    return new Promise(resolve => {
        chrome.storage.local.set({ [key]: value }, resolve);
    });
};

const remove = (key: string): Promise<void> => {
    return new Promise(resolve => {
        chrome.storage.local.remove(key, resolve);
    });
};

// api publica 
export const storage = {
    getToken: () => get<string>(KEYS.TOKEN),
    setToken: (token: string) => set(KEYS.TOKEN, token),
    removeToken: () => remove(KEYS.TOKEN),

    getUser: () => get<StoredUser>(KEYS.USER),
    setUser: (user: StoredUser) => set(KEYS.USER, user),
    removeUser: () => remove(KEYS.USER),

    getApiUrl: async (): Promise<string> => {
        const saved = await get<string>(KEYS.API_URL);
        return saved ?? 'http://localhost:3000/api';
    },
    setApiUrl: (url: string) => set(KEYS.API_URL, url),

    getLastSync: () => get<string>(KEYS.LAST_SYNC),
    setLastSync: (date: string) => set(KEYS.LAST_SYNC, date),

    clearAuth: async () => {
        await remove(KEYS.TOKEN);
        await remove(KEYS.USER);
    },
};