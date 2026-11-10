export default {
  id: "torrentio",
  name: "Torrentio Official",
  baseUrl: "https://torrentio.strem.fun",
  cinemetaUrl: "https://v3-cinemeta.strem.io",

   TRACKERS: [
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.demonii.com:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "http://tracker.openbittorrent.com:80/announce"
  ],

  detectLanguages(text = "") {
    const t = text.toLowerCase();
    const langs = [];
    if (/\btamil\b|\btam\b|🇮🇳.*tam/i.test(t)) langs.push("Tamil");
    if (/\btelugu\b|\btel\b/i.test(t)) langs.push("Telugu");
    if (/\bhindi\b|\bhin\b/i.test(t)) langs.push("Hindi");
    if (/\bmalayalam\b|\bmal\b/i.test(t)) langs.push("Malayalam");
    if (/\bkannada\b|\bkan\b/i.test(t)) langs.push("Kannada");
    if (/\benglish\b|\beng\b|🇬🇧|🇺🇸/i.test(t)) langs.push("English");
    if (/multi|dual[\s.-]*audio/i.test(t)) langs.push("Multi");
    if (langs.length === 0) langs.push("English");
    return [...new Set(langs)];
  },

  detectQuality(text = "") {
    if (/2160p|4k|uhd/i.test(text)) return "4K UHD";
    if (/1080p|fhd/i.test(text)) return "1080p FHD";
    if (/720p|hd/i.test(text)) return "720p HD";
    if (/480p|sd/i.test(text)) return "480p";
    return "HD";
  },

  buildMagnet(infoHash, name = "Movie") {
    const tr = this.TRACKERS.map(t => `&tr=${encodeURIComponent(t)}`).join("");
    return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(name)}${tr}`;
  },

  async getHomeFeed() {
    try {
      const res = await fetch(`${this.cinemetaUrl}/catalog/movie/top.json`);
      const data = await res.json();
      return (data.metas || []).slice(0, 30).map(item => ({
        id: item.imdb_id || item.id,
        imdbId: item.imdb_id || item.id,
        title: item.name,
        year: item.releaseInfo || "",
        poster: item.poster,
        background: item.background || item.poster,
        rating: item.imdbRating || "N/A",
        description: item.description || "",
        provider: "Torrentio Official",
        language: "English / Multi"
      }));
    } catch (err) {
      console.error("Torrentio HomeFeed Error:", err);
      return [];
    }
  },

  async getStreams(imdbId, options = {}) {
    if (!imdbId || !imdbId.startsWith("tt")) return [];
    try {
      // Request all major indexers and prioritize regional audio streams
      const configPath = "providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrentgalaxy,magnetdl|language=tamil,telugu,hindi,malayalam,english";
      const url = `${this.baseUrl}/${configPath}/stream/movie/${imdbId}.json`;
      const res = await fetch(url);
      const data = await res.json();

      return (data.streams || []).map((s, idx) => {
        const rawTitle = s.title || s.name || "Torrent Stream";
        const lines = rawTitle.split("\n");
        const releaseName = lines[0] || "Movie Stream";
        const metaLine = lines.slice(1).join(" ") || "";

        const seedMatch = rawTitle.match(/👤\s*(\d+)/);
        const sizeMatch = rawTitle.match(/💾\s*([\d.]+\s*[GMK]B)/i);
        const sourceMatch = rawTitle.match(/⚙️\s*([^\n]+)/);

        const languages = this.detectLanguages(rawTitle + " " + (s.name || ""));
        // If user searched/selected a Tamil movie and stream is Multi-Audio or Indian indexer, tag appropriately
        if (options.preferredLang === "Tamil" && /tamilmv|tamilblasters|galaxy/i.test(rawTitle)) {
          if (!languages.includes("Tamil")) languages.unshift("Tamil");
        }

        const quality = this.detectQuality( `${s.name} ${rawTitle}` );
        const infoHash = s.infoHash || "";
        const magnet = infoHash ? this.buildMagnet(infoHash, releaseName) : (s.url || "");

        return {
          id: `${imdbId}-tio-${idx}`,
          provider: "Torrentio",
          indexer: sourceMatch ? sourceMatch[1].trim() : "Torrentio Official",
          title: releaseName,
          quality,
          size: sizeMatch ? sizeMatch[1] : "Unknown Size",
          seeders: seedMatch ? parseInt(seedMatch[1], 10) : 10,
          languages,
          languageBadge: languages.join(" + "),
          infoHash,
          fileIdx: typeof s.fileIdx === "number" ? s.fileIdx : 0,
          magnet,
          url: s.url || magnet,
          imdbId
        };
      });
    } catch (err) {
      console.error("Torrentio getStreams error:", err);
      return [];
    }
  }
};
