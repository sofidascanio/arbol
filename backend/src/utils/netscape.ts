// tipos 
export interface NetscapeBookmark {
    title: string;
    url: string;
    addDate?: number;       // Unix timestamp
    tags?: string[];
    folderPath?: string[];  // ['Trabajo', 'Frontend'] = Trabajo/Frontend
}

export interface NetscapeFolder {
    name: string;
    children: (NetscapeBookmark | NetscapeFolder)[];
    addDate?: number;
}

export type NetscapeNode = NetscapeBookmark | NetscapeFolder;

const isFolder = (node: NetscapeNode): node is NetscapeFolder => 'children' in node;

// parser: HTML Netscape -> objetos 
export const parseNetscapeHTML = (html: string): NetscapeBookmark[] => {
    const bookmarks: NetscapeBookmark[] = [];

    // extrae todos los <A> con su contexto de carpetas
    // usa regex porque no hay dom en nodejs (sin dependencias extra)
    const lines = html.split('\n');
    const folderStack: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // detecta apertura de carpeta: <DT><H3 ...>Nombre</H3>
        const folderMatch = trimmed.match(/<H3[^>]*>([^<]+)<\/H3>/i);
        if (folderMatch) {
            folderStack.push(folderMatch[1].trim());
            continue;
        }

        // detecta cierre de carpeta: </DL>
        if (trimmed.match(/<\/DL>/i) && folderStack.length > 0) {
            folderStack.pop();
            continue;
        }

        // detecta marcador: <DT><A HREF="..." ...>Título</A>
        const bookmarkMatch = trimmed.match(
            /<A\s+HREF="([^"]+)"[^>]*(?:ADD_DATE="(\d+)")?[^>]*(?:TAGS="([^"]*)")?[^>]*>([^<]*)<\/A>/i
        );

        if (bookmarkMatch) {
        const [, url, addDate, tagsStr, title] = bookmarkMatch;

        // valida URL 
        try {
            new URL(url);
        } catch {
            continue; // salta urls invalidas
        }

        const tags = tagsStr
            ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        bookmarks.push({
            title: title.trim() || new URL(url).hostname,
            url,
            addDate: addDate ? parseInt(addDate) : undefined,
            tags,
            folderPath: [...folderStack],
        });
        }
    }

    return bookmarks;
};

// writer: objetos -> HTML Netscape 
interface BookmarkForExport {
    title: string;
    url: string;
    createdAt: Date;
    tags: { tag: { name: string } }[];
    folder: { name: string } | null;
}

export const generateNetscapeHTML = (
    bookmarks: BookmarkForExport[],
    title = 'Bookmark Manager Export'
): string => {
    // agrupa por carpeta
    const byFolder = new Map<string, BookmarkForExport[]>();
    const noFolder: BookmarkForExport[] = [];

    for (const bm of bookmarks) {
        if (bm.folder) {
            const key = bm.folder.name;
            if (!byFolder.has(key)) byFolder.set(key, []);
            byFolder.get(key)!.push(bm);
        } else {
            noFolder.push(bm);
        }
    }

    const renderBookmark = (bm: BookmarkForExport, indent: string): string => {
        const addDate = Math.floor(bm.createdAt.getTime() / 1000);
        const tags = bm.tags.map(bt => bt.tag.name).join(',');
        const tagsAttr = tags ? ` TAGS="${tags}"` : '';
        return `${indent}<DT><A HREF="${escapeHtml(bm.url)}" ADD_DATE="${addDate}"${tagsAttr}>${escapeHtml(bm.title)}</A>`;
    };

    const renderFolder = (
        name: string,
        items: BookmarkForExport[],
        indent: string
    ): string => {
        const addDate = Math.floor(Date.now() / 1000);
        const lines = [
            `${indent}<DT><H3 ADD_DATE="${addDate}">${escapeHtml(name)}</H3>`,
            `${indent}<DL><p>`,
            ...items.map(bm => renderBookmark(bm, indent + '    ')),
            `${indent}</DL><p>`,
        ];
        return lines.join('\n');
    };

    const lines = [
        '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
        '<!-- This is an automatically generated file.',
        '     It will be read and overwritten.',
        '     DO NOT EDIT! -->',
        '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
        `<TITLE>${escapeHtml(title)}</TITLE>`,
        `<H1>${escapeHtml(title)}</H1>`,
        '<DL><p>',
        // marcadores sin carpeta
        ...noFolder.map(bm => renderBookmark(bm, '    ')),
        // carpetas
        ...[...byFolder.entries()].map(([name, items]) =>
            renderFolder(name, items, '    ')
        ),
        '</DL><p>',
    ];

    return lines.join('\n');
};

// helpers 
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');