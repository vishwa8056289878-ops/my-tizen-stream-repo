export default {
    name: "HiAnime",
    baseUrl: "https://hianime.to",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },

    async getHomeFeed() {
        const res = await fetch(`${this.baseUrl}/home`, { headers: this.headers });
        const html = await res.text();
        return this.parseCards(html);
    },

    async search(query) {
        const res = await fetch(`${this.baseUrl}/search?keyword=${encodeURIComponent(query)}`, { headers: this.headers });
        const html = await res.text();
        return this.parseCards(html);
    },

    parseCards(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const items = [];
        doc.querySelectorAll(".flw-item").forEach(el => {
            const a = el.querySelector(".film-name a");
            const img = el.querySelector(".film-poster-img");
            if (a) {
                items.push({
                    id: a.getAttribute("href"),
                    title: a.textContent.trim(),
                    poster: img?.getAttribute("data-src") || img?.getAttribute("src") || ""
                });
            }
        });
        return items;
    },

    async getStreams(path) {
        const idMatch = path.match(/-(\d+)(\?|$)/);
        if (!idMatch) return [];
        const animeId = idMatch[1];

        const epRes = await fetch(`${this.baseUrl}/ajax/v2/episode/list/${animeId}`, { headers: this.headers });
        const epJson = await epRes.json();
        const epDoc = new DOMParser().parseFromString(epJson.html, "text/html");
        const firstEpId = epDoc.querySelector(".ssl-item.ep-item")?.getAttribute("data-id");
        if (!firstEpId) return [];

        const srvRes = await fetch(`${this.baseUrl}/ajax/v2/episode/servers?episodeId=${firstEpId}`, { headers: this.headers });
        const srvJson = await srvRes.json();
        const srvDoc = new DOMParser().parseFromString(srvJson.html, "text/html");
        const serverId = srvDoc.querySelector(".server-item")?.getAttribute("data-id");
        if (!serverId) return [];

        const srcRes = await fetch(`${this.baseUrl}/ajax/v2/episode/sources?id=${serverId}`, { headers: this.headers });
        const srcData = await srcRes.json();
        if (!srcData.link) return [];

        const embedRes = await fetch(srcData.link, { headers: this.headers });
        const embedText = await embedRes.text();
        const m3u8Match = embedText.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);

        if (m3u8Match) {
            return [{
                label: "Episode 1 - Direct HLS (1080p)",
                url: m3u8Match[1],
                type: "direct",
                subtitles: []
            }];
        }
        return [];
    }
};
