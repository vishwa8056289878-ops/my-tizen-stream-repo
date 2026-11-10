/*
 * NEON STREAM - IMDb ID based unified provider
 *
 * One module for movie/series/anime discovery.
 * Metadata is retrieved from Cinemeta by IMDb ID.
 *
 * Playback is intentionally delegated to an authorized
 * media API. Set SOURCE_API to the base URL of an API
 * you own or are licensed to use. Expected endpoint:
 *   GET {SOURCE_API}/titles/{imdbId}/streams
 *
 * Expected response:
 *   { "streams": [{ "url": "https://...", "language": "...",
 *      "languages": [], "resolution": "1080p",
 *      "codec": "H264", "hdrFormat": "SDR",
 *      "audioTracks": [], "subtitles": [] }] }
 */

const UnifiedProvider = {
    id: "neon-unified",
    name: "NEON STREAM IMDb Unified",
    version: "4.0.1",

    META_URL: "https://v3-cinemeta.strem.io",

    // Configure only an authorized playback API you control.
    // Leave empty to use metadata discovery without playback.
    SOURCE_API: "",

    LANGUAGES: [
        "Tamil", "English", "Telugu", "Hindi",
        "Malayalam", "Japanese", "Multi"
    ],

    RESOLUTIONS: [
        "480p", "720p", "1080p", "1440p", "2160p"
    ],

    _cache: new Map(),

    async requestJson(url) {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status + " for " + url);
        }

        return response.json();
    },

    normalizeItem(item, type) {
        if (!item || !item.id) return null;

        return {
            id: item.id,
            imdbId: item.id,
            title: item.name || "Untitled",
            type: type,
            year: item.releaseInfo || "",
            rating: item.imdbRating || "N/A",
            poster: item.poster || "",
            background: item.background || item.poster || "",
            description: item.description || "",
            genres: Array.isArray(item.genres) ? item.genres : [],
            languages: Array.isArray(item.languages) ? item.languages : [],
            provider: this.name
        };
    },

    async getCatalog(type) {
        const mediaType = type === "series" ? "series" : "movie";
        const cacheKey = "catalog:" + mediaType;
        const cached = this._cache.get(cacheKey);

        if (cached && Date.now() - cached.time < 60000) {
            return cached.value;
        }

        const data = await this.requestJson(
            this.META_URL + "/catalog/" + mediaType + "/top.json"
        );

        const items = (data.metas || [])
            .map(item => this.normalizeItem(item, mediaType))
            .filter(Boolean);

        this._cache.set(cacheKey, {
            time: Date.now(),
            value: items
        });

        return items;
    },

    async getMovies() {
        return this.getCatalog("movie");
    },

    async getSeries() {
        return this.getCatalog("series");
    },

    async getAnime() {
        // Metadata catalogue does not guarantee an anime-only feed.
        // Use search/type metadata and filter titles in the UI.
        const movies = await this.getMovies();
        const series = await this.getSeries();
        return movies.concat(series).filter(item =>
            (item.genres || []).some(genre =>
                String(genre).toLowerCase() === "animation"
            )
        );
    },

    async getHomeFeed() {
        const results = await Promise.allSettled([
            this.getMovies(),
            this.getSeries()
        ]);

        const movies = results[0].status === "fulfilled"
            ? results[0].value : [];
        const series = results[1].status === "fulfilled"
            ? results[1].value : [];

        const unique = new Map();
        movies.concat(series).forEach(item => unique.set(item.id, item));
        return Array.from(unique.values());
    },

    async search(query, type) {
        const q = String(query || "").trim();
        if (!q) return [];

        const types = !type || type === "all"
            ? ["movie", "series"]
            : [type === "tv" ? "series" : type];

        const results = await Promise.all(types.map(async mediaType => {
            if (mediaType !== "movie" && mediaType !== "series") {
                return [];
            }

            const url = this.META_URL +
                "/catalog/" + mediaType +
                "/top/search=" + encodeURIComponent(q) + ".json";

            try {
                const data = await this.requestJson(url);
                return (data.metas || [])
                    .map(item => this.normalizeItem(item, mediaType))
                    .filter(Boolean);
            } catch (error) {
                console.warn("Search failed for " + mediaType, error);
                return [];
            }
        }));

        const unique = new Map();
        results.flat().forEach(item => unique.set(item.id, item));
        return Array.from(unique.values());
    },

    async getDetails(imdbId, type) {
        if (!/^tt\d+$/i.test(String(imdbId || ""))) {
            throw new Error("A valid IMDb ID is required.");
        }

        const mediaType = type === "series" ? "series" : "movie";
        const data = await this.requestJson(
            this.META_URL + "/meta/" + mediaType + "/" +
            encodeURIComponent(imdbId) + ".json"
        );

        return data.meta
            ? this.normalizeItem(data.meta, mediaType)
            : null;
    },

    async getStreams(imdbId, item) {
        if (!/^tt\d+$/i.test(String(imdbId || ""))) {
            return [];
        }

        if (!this.SOURCE_API) {
            console.info(
                "Unified provider: metadata is available; configure SOURCE_API " +
                "to connect an authorized playback service."
            );
            return [];
        }

        const base = this.SOURCE_API.replace(/\/+$/, "");
        const url = base + "/titles/" +
            encodeURIComponent(imdbId) + "/streams";

        const data = await this.requestJson(url);
        const streams = Array.isArray(data.streams) ? data.streams : [];

        return streams
            .filter(stream =>
                stream &&
                typeof stream.url === "string" &&
                /^https:\/\//i.test(stream.url)
            )
            .map((stream, index) => ({
                id: stream.id || imdbId + "-source-" + index,
                imdbId: imdbId,
                title: stream.title || (item && item.title) || "Media source",
                label: stream.label || stream.quality || "Source",
                url: stream.url,
                type: "direct",
                language: stream.language || "Unknown",
                languages: Array.isArray(stream.languages) ? stream.languages : [],
                resolution: stream.resolution || "Unknown",
                codec: stream.codec || "Unknown",
                hdrFormat: stream.hdrFormat || "Unknown",
                size: stream.size || "Unknown",
                audioTracks: Array.isArray(stream.audioTracks) ? stream.audioTracks : [],
                subtitles: Array.isArray(stream.subtitles) ? stream.subtitles : [],
                provider: this.name
            }));
    }
};

export default UnifiedProvider;
