//#region src/content/content.ts
var extractMetadata = () => {
	const getMeta = (name) => {
		return (document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`))?.getAttribute("content") ?? "";
	};
	return {
		url: window.location.href,
		title: getMeta("og:title") || getMeta("twitter:title") || document.title || "",
		description: getMeta("og:description") || getMeta("description") || getMeta("twitter:description") || "",
		image: getMeta("og:image") || getMeta("twitter:image") || "",
		siteName: getMeta("og:site_name") || ""
	};
};
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "GET_METADATA") sendResponse(extractMetadata());
	return true;
});
//#endregion
