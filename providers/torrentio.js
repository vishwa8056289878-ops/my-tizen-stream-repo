export default {
    name: "Global Movies (Torrentio)",
    catalogUrl: "https://v3-cinemeta.strem.io",
    streamUrl: "https://torrentio.strem.fun",
    wssTrackers: [
        "wss://tracker.openwebtorrent.com",
        "wss://tracker.btorrent.xyz",
        "wss://tracker.webtorrent.dev",
        "wss://tracker.files.fm:7073/announce"
    ],

    async getHomeFeed() {
        const res = await fetch(`${this.catalogUrl}/catalog/movie/top.json`);
        const data = await res.json();
        return (data.metas || []).slice(0, 40).map(m => ({
            id: m.id,
            title: `${m.name} (${m.releaseInfo || ''})`,
            poster: m.poster,
            imdbId: m.id
        }));
    },

    async search(query) {
        const res = await fetch(`${this.catalogUrl}/catalog/movie/top/search=${encodeURIComponent(query)}.json`);
        const data = await res.json();
        return (data.metas || []).map(m => ({
            id: m.id,
            title: `${m.name} (${m.releaseInfo || ''})`,
            poster: m.poster,
            imdbId: m.id
        }));
    },

    async getStreams(id) {
        const res = await fetch(`${this.streamUrl}/stream/movie/${id}.json`);
        const data = await res.json();
        const trackerStr = this.wssTrackers.map(t => `&tr=${encodeURIComponent(t)}`).join("");

        return (data.streams || []).slice(0, 8).map(s => ({
            label: s.title ? s.title.split("\n")[0] : "Torrent Stream",
            url: `magnet:?xt=urn:btih:${s.infoHash}&dn=${encodeURIComponent(s.title || "video")}${trackerStr}`,
            type: "torrent",
            subtitles: []
        }));
    }
};
