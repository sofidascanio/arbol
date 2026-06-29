interface BookmarkMetadata {
    title?: string;
    description?: string;
    imageUrl?: string;
    faviconUrl?: string;
}

// extrae metadata de una url usando open graph y favicon
export const fetchUrlMetadata = async (
    url: string
): Promise<BookmarkMetadata> => {
    try {
        const domain = new URL(url).hostname;

        // favicon via google s2 (siempre disponible, no requiere fetch)
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        // intenta obtener open graph image del html
        let imageUrl: string | undefined;
        let title: string | undefined;
        let description: string | undefined;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)',
                },
            });

            clearTimeout(timeout);

            if (response.ok) {
                const html = await response.text();

                // extrae og:image
                const ogImage = html.match(
                    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
                )?.[1] ||
                html.match(
                /   <meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
                )?.[1];

                // extrae og:title o title
                const ogTitle = html.match(
                    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
                )?.[1] ||
                html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

                // Extraer og:description o description
                const ogDesc = html.match(
                    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
                )?.[1] ||
                html.match(
                    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
                )?.[1];

                if (ogImage) {
                    // resuelve url relativa
                    imageUrl = ogImage.startsWith('http')
                        ? ogImage
                        : new URL(ogImage, url).href;
                }

                if (ogTitle) title = ogTitle.trim();
                if (ogDesc) description = ogDesc.trim();
            }
        } catch {
            // timeout o error de red, continua sin imagen
        }

        return { faviconUrl, imageUrl, title, description };
    } catch {
        return {};
    }
};