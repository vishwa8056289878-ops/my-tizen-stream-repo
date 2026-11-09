export default {
    name: "Torrentio & Catalog",
    webRtcTrackers: [
        "wss://tracker.openwebtorrent.com",
        "wss://tracker.btorrent.xyz",
        "wss://tracker.webtorrent.dev",
        "wss://tracker.files.fm:7073/announce"
    ],
    async search(query) {
        try {
            const res = await fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(query)}.json`);
            const data = await res.json();
            if (!data.metas) return [];

            return data.metas.map(m => ({
                id: m.id,
                title: m.name,
                poster: m.poster,
                type: "torrent"
            }));
        } catch (e) {
            console.error("Search error:", e);
            return [];
        }
    },
    async getHomeFeed() {
        try {
            const res = await fetch("https://v3-cinemeta.strem.io/catalog/movie/top.json");
            const data = await res.json();
            return data.metas.map(m => ({
                id: m.id,
                title: m.name,
                poster: m.poster,
                type: "torrent"
            }));
        } catch (e) {
            console.error("Home feed error:", e);
            return [];
        }
    },
    async getStreamUrl(itemId) {
        try {
            const res = await fetch(`https://torrentio.strem.fun/stream/movie/${itemId}.json`);
            const data = await res.json();

            if (!data.streams || data.streams.length === 0) return null;

            const bestStream = data.streams[0];
            const trackers = [...this.webRtcTrackers, ...(bestStream.sources || [])]
                .map(t => `&tr=${encodeURIComponent(t.replace(/^tracker:/, ""))}`).join("");

            return `magnet:?xt=urn:btih:${bestStream.infoHash}&dn=${encodeURIComponent(bestStream.title || "Stream")}${trackers}`;
        } catch (e) {
            console.error("Stream resolution error:", e);
            return null;
        }
    }
};
