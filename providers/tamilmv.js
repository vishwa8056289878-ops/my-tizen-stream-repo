export default {
    name: "TamilMV",
    baseUrl: "https://www.1tamilmv.io",
    headers: { "User-Agent": "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36" },
    wssTrackers: [
        "wss://tracker.openwebtorrent.com",
        "wss://tracker.btorrent.xyz",
        "wss://tracker.webtorrent.dev"
    ],

    async getHomeFeed() {
        const res = await fetch(this.baseUrl, { headers: this.headers });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const items = [];

        doc.querySelectorAll('a[href*="/forums/topic/"]').forEach(a => {
            const title = a.textContent.trim();
            const href = a.getAttribute("href");
            if (title.length > 12 && !items.some(i => i.id === href)) {
                items.push({
                    id: href,
                    title: title,
                    poster: "https://via.placeholder.com/240x360/151928/5865f2?text=TamilMV"
                });
            }
        });
        return items.slice(0, 35);
    },

    async search(query) {
        const url = `${this.baseUrl}/index.php?/search/&q=${encodeURIComponent(query)}&type=forums_topic`;
        const res = await fetch(url, { headers: this.headers });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const items = [];

        doc.querySelectorAll("li.ipsStreamItem, li.ipsDataItem").forEach(el => {
            const a = el.querySelector('a[href*="/forums/topic/"]');
            if (a) {
                items.push({
                    id: a.getAttribute("href"),
                    title: a.textContent.trim(),
                    poster: "https://via.placeholder.com/240x360/151928/5865f2?text=TamilMV"
                });
            }
        });
        return items;
    },

    async getStreams(topicUrl) {
        const res = await fetch(topicUrl, { headers: this.headers });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const streams = [];
        const trackerStr = this.wssTrackers.map(t => `&tr=${encodeURIComponent(t)}`).join("");

        doc.querySelectorAll('a[href^="magnet:"]').forEach((a, idx) => {
            const rawMagnet = a.getAttribute("href");
            const dnMatch = rawMagnet.match(/dn=([^&]+)/);
            const label = dnMatch ? decodeURIComponent(dnMatch[1]).substring(0, 45) : `Magnet Stream #${idx + 1}`;
            streams.push({
                label: label,
                url: `${rawMagnet}${trackerStr}`,
                type: "torrent",
                subtitles: []
            });
        });

        if (streams.length === 0) {
            const regexMatches = html.match(/magnet:\?xt=urn:btih:[a-zA-Z0-9]{32,40}[^"'\s<]*/gi) || [];
            regexMatches.forEach((rawMagnet, idx) => {
                streams.push({
                    label: `Extracted Magnet #${idx + 1}`,
                    url: `${rawMagnet}${trackerStr}`,
                    type: "torrent",
                    subtitles: []
                });
            });
        }
        return streams;
    }
};
