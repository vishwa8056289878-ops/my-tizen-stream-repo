export default {
  id: "torrentio",
  name: "Torrentio Official",
  baseUrl: "https://torrentio.strem.fun",
  imdbCatalogUrl: "https://v3-cinemeta.strem.io",

  TRACKERS: [
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.demonii.com:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "http://tracker.openbittorrent.com:80/announce"
  ],

  buildMagnet(infoHash, title = "Movie") {
    if (!infoHash) return "";
    const tr = this.TRACKERS.map(t => `&tr=${encodeURIComponent(t)}`).join("");
    return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}${tr}`;
  },

  parseLanguages(text = "") {
    const lower = text.toLowerCase();
    const list = [];
    if (/\btamil\b|\btam\b|1tamilmv|tamilblasters/i.test(lower)) list.push("Tamil");
    if (/\btelugu\b|\btel\b/i.test(lower)) list.push("Telugu");
    if (/\bhindi\b|\bhin\b/i.test(lower)) list.push("Hindi");
    if (/\bmalayalam\b|\bmal\b/i.test(lower)) list.push("Malayalam");
    if (/\bkannada\b|\bkan\b/i.test(lower)) list.push("Kannada");
    if (/\benglish\b|\beng\b|yts/i.test(lower)) list.push("English");
    if (/multi|dual[\s.-]*audio/i.test(lower)) list.push("Multi-Audio");
    return list.length ? [...new Set(list)] : ["English"];
  },

  parseQuality(text = "") {
    if (/2160p|4k|uhd/i.test(text)) return "4K UHD";
    if (/1080p|fhd/i.test(text)) return "1080p FHD";
    if (/720p|hd/i.test(text)) return "720p HD";
    return "1080p HD";
  },

  // IMDb-Only Catalog Fetcher (Title, Poster, Background, Plot Description, IMDb Score)
  async getIMDbCatalog(genre = "") {
    try {
      const path = genre
        ? `/catalog/movie/top/genre=${encodeURIComponent(genre)}.json`
        : `/catalog/movie/top.json`;
      const res = await fetch(`${this.imdbCatalogUrl}${path}`);
      const data = await res.json();
      return (data.metas || []).map(item => ({
        id: item.imdb_id || item.id,
        imdbId: item.imdb_id || item.id,
        title: item.name,
        year: String(item.releaseInfo || "2024"),
        imdbScore: String(item.imdbRating || "8.0"),
        poster: item.poster || `https://images.metahub.space/poster/medium/${item.id}/img`,
        background: item.background || `https://images.metahub.space/background/medium/${item.id}/img`,
        description: item.description || "Official IMDb catalog title.",
        genres: item.genres || ["Movie"],
        runtime: item.runtime || "2h 15m"
      }));
    } catch (err) {
      console.error("IMDb Catalog Error:", err);
      return [];
    }
  },

  // IMDb Title Page Full Metadata Fetcher
  async getIMDbDetails(imdbId) {
    try {
      const res = await fetch(`${this.imdbCatalogUrl}/meta/movie/${imdbId}.json`);
      const data = await res.json();
      const m = data.meta || {};
      return {
        id: imdbId,
        imdbId,
        title: m.name || "Movie Title",
        year: String(m.releaseInfo || "2024"),
        imdbScore: String(m.imdbRating || "8.1"),
        poster: m.poster || `https://images.metahub.space/poster/medium/${imdbId}/img`,
        background: m.background || `https://images.metahub.space/background/medium/${imdbId}/img`,
        description: m.description || "No IMDb plot summary available.",
        genres: m.genres || ["Drama", "Action"],
        cast: m.cast || [],
        director: m.director || [],
        runtime: m.runtime || "2h 20m"
      };
    } catch {
      return null;
    }
  },

  // Fetch Magnet Links from Official Torrentio
  async getStreams(imdbId) {
    if (!imdbId || !imdbId.startsWith("tt")) return [];
    try {
      const filter = "providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrentgalaxy,magnetdl|language=tamil,telugu,hindi,malayalam,english";
      const res = await fetch(`${this.baseUrl}/${filter}/stream/movie/${imdbId}.json`);
      const data = await res.json();
      return (data.streams || []).map((s, index) => {
        const raw = s.title || s.name || "Torrent Stream";
        const releaseTitle = raw.split("\n")[0];
        const seedMatch = raw.match(/👤\s*(\d+)/);
        const sizeMatch = raw.match(/💾\s*([\d.]+\s*[GMK]B)/i);
        const indexerMatch = raw.match(/⚙️\s*([^\n]+)/);
        const infoHash = s.infoHash || "";
        const magnet = infoHash ? this.buildMagnet(infoHash, releaseTitle) : (s.url || "");
        const languages = this.parseLanguages(`${raw} ${s.name || ""}`);

        return {
          id: `${imdbId}-torrentio-${index}`,
          provider: "Torrentio",
          indexer: indexerMatch ? indexerMatch[1].trim() : "Torrentio Official",
          title: releaseTitle,
          quality: this.parseQuality(`${s.name || ""} ${raw}`),
          size: sizeMatch ? sizeMatch[1] : "2.1 GB",
          seeders: seedMatch ? parseInt(seedMatch[1], 10) : 25,
          languages,
          audioLabel: languages.join(" • "),
          infoHash,
          fileIdx: typeof s.fileIdx === "number" ? s.fileIdx : 0,
          magnet,
          imdbId
        };
      });
    } catch (err) {
      console.error("Torrentio magnet error:", err);
      return [];
    }
  }
};
