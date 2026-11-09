export default {
    name: "UHDMovies",
    baseUrl: "https://uhdmovies.beer",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },

    async getHomeFeed() {
        const res = await fetch(this.baseUrl, { headers: this.headers });
        const html = await res.text();
        return this.parseCards(html);
    },

    async search(query) {
        const res = await fetch(`${this.baseUrl}/?s=${encodeURIComponent(query)}`, { headers: this.headers });
        const html = await res.text();
        return this.parseCards(html);
    },

    parseCards(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const items = [];
        doc.querySelectorAll("article").forEach(el => {
            const a = el.querySelector(".entry-title a, a");
            const img = el.querySelector("img");
            if (a) {
                items.push({
                    id: a.getAttribute("href"),
                    title: a.textContent.trim(),
                    poster: img?.getAttribute("src") || ""
                });
            }
        });
        return items;
    },

    async getStreams(postUrl) {
        const res = await fetch(postUrl, { headers: this.headers });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const streams = [];

        doc.querySelectorAll(".entry-content a").forEach(a => {
            const href = a.getAttribute("href") || "";
            const text = a.textContent.trim();
            if (href.match(/\.(mkv|mp4)$/i) || text.match(/1080p|2160p|4K|Download/i)) {
                streams.push({
                    label: text || "Direct High-Bitrate Stream",
                    url: href,
                    type: "direct",
                    subtitles: []
                });
            }
        });
        return streams.slice(0, 6);
    }
};
