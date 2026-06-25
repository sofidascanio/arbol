const BASE_URL = '/api/import-export';

const getToken = (): string | null => localStorage.getItem('token');

const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
});

export interface ImportResult {
    imported: number;
    skipped: number;
    failed: number;
    errors: string[];
}

export interface PreviewResult {
    total: number;
    new: number;
    duplicates: number;
    sample: {
        title: string;
        url: string;
        isDuplicate: boolean;
        folder: string | null;
    }[];
}

export const importExportService = {
    // descarga exportacion
    export: async (format: 'html' | 'json') => {
        const response = await fetch(
            `${BASE_URL}/export?format=${format}`,
            { headers: authHeaders() }
        );

        if (!response.ok) throw new Error('Error al exportar');

        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition') ?? '';
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        const filename = filenameMatch?.[1] ?? `bookmarks.${format}`;

        // dispara descarga en el navegador
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // previsualiza importacion
    preview: async (file: File): Promise<PreviewResult> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/preview`, {
            method: 'POST',
            headers: authHeaders(),
            body: formData,
        });

        const json = await response.json();
        if (!json.success) throw new Error(json.message ?? 'Error al previsualizar');
        return json.data as PreviewResult;
    },

    // importa archivo
    import: async (
        file: File,
        options: {
            skipDuplicates?: boolean;
            folderId?: string;
        } = {}
    ): Promise<ImportResult> => {
        const formData = new FormData();
        formData.append('file', file);
        if (options.skipDuplicates !== undefined) {
            formData.append('skipDuplicates', String(options.skipDuplicates));
        }
        if (options.folderId) {
            formData.append('folderId', options.folderId);
        }

        const response = await fetch(`${BASE_URL}/import`, {
            method: 'POST',
            headers: authHeaders(),
            body: formData,
        });

        const json = await response.json();
        if (!json.success) throw new Error(json.message ?? 'Error al importar');
        return json.data as ImportResult;
    },
};