// extrae metadatos Open Graph y basicos de la pagina actual
const extractMetadata = () => {
    const getMeta = (name: string): string => {
        const el =
            document.querySelector(`meta[property="${name}"]`) ||
            document.querySelector(`meta[name="${name}"]`);
        return el?.getAttribute('content') ?? '';
    };

    return {
        url: window.location.href,
        title:
            getMeta('og:title') ||
            getMeta('twitter:title') ||
            document.title ||
            '',
        description:
            getMeta('og:description') ||
            getMeta('description') ||
            getMeta('twitter:description') ||
            '',
        image:
            getMeta('og:image') ||
            getMeta('twitter:image') ||
            '',
        siteName: getMeta('og:site_name') || '',
    };
};

// escucha mensajes del popup pidiendo metadatos
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_METADATA') {
        sendResponse(extractMetadata());
    }
    return true;
});