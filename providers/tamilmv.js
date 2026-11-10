import torrentio from "./torrentio.js";

export default {
  id: "tamilmv",
  name: "1TamilMV Official",
  mediaFusionUrl: "https://mediafusion.elfhosted.com",
  cinemetaUrl: "https://v3-cinemeta.strem.io",

  // Curated Popular & Recent Tamil Blockbusters with verified IMDb IDs for instant Torrentio/TamilMV resolution
  TAMIL_CATALOG: [
    { id: "tt26446278", title: "The Greatest of All Time (GOAT)", year: "2024", rating: "6.8", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt26446278/img" },
    { id: "tt27540542", title: "Amaran", year: "2024", rating: "8.4", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt27540542/img" },
    { id: "tt15654328", title: "Leo", year: "2023", rating: "7.2", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt15654328/img" },
    { id: "tt15302222", title: "Jailer", year: "2023", rating: "7.1", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt15302222/img" },
    { id: "tt9179430", title: "Vikram", year: "2022", rating: "8.3", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt9179430/img" },
    { id: "tt23849204", title: "Maharaja", year: "2024", rating: "8.5", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt23849204/img" },
    { id: "tt27191032", title: "Vettaiyan", year: "2024", rating: "7.0", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt27191032/img" },
    { id: "tt1187043", title: "Kanguva", year: "2024", rating: "6.2", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt21382412/img", imdbId: "tt21382412" },
    { id: "tt10709484", title: "Ponniyin Selvan: Part 1", year: "2022", rating: "7.6", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt10709484/img" },
    { id: "tt22444570", title: "Lubber Pandhu", year: "2024", rating: "8.3", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt22444570/img" },
    { id: "tt26733317", title: "Meiyazhagan", year: "2024", rating: "8.5", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt26733317/img" },
    { id: "tt15097216", title: "Jai Bhim", year: "2021", rating: "8.7", language: "Tamil", poster: "https://images.metahub.space/poster/medium/tt15097216/img" }
  ],

  async getHomeFeed() {
    return this.TAMIL_CATALOG.map(m => ({
      ...m,
      imdbId: m.imdbId || m.id,
      provider: "1TamilMV"
    }));
  },

  async getStreams(imdbId, movieTitle = "") {
    const streams = [];
    // 1. Fetch from MediaFusion ElfHosted (scrapes 1TamilMV & TamilBlasters directly)
    try {
      const res = await fetch(`${this.mediaFusionUrl}/stream/movie/${imdbId}.json`);
      if (res.ok) {
        const data = await res.json();
        (data.streams || []).forEach((s, idx) => {
          const desc = `${s.name || ""} ${s.description || s.title || ""}`;
          const infoHash = s.infoHash || "";
          const magnet = infoHash ? torrentio.buildMagnet(infoHash, movieTitle || desc) : (s.url || "");
          if (magnet || s.url) {
            const langs = torrentio.detectLanguages(desc + " Tamil");
            streams.push({
              id: `${imdbId}-tmv-mf-${idx}`,
              provider: "1TamilMV",
              indexer: "1TamilMV Official",
              title: (s.description || s.title || movieTitle || "1TamilMV Official Release").replace(/\n/g, " • "),
              quality: torrentio.detectQuality(desc),
              size: (desc.match(/([\d.]+\s*[GMK]B)/i) || [null, "1.8 GB"])[1],
              seeders: 45,
              languages: langs.includes("Tamil") ? langs : ["Tamil", ...langs],
              languageBadge: langs.includes("Tamil") ? langs.join(" + ") : `Tamil + ${langs.join(" + ")}`,
              infoHash,
              magnet,
              url: s.url || magnet,
              imdbId
            });
          }
        });
      }
    } catch (e) {
      console.warn("1TamilMV MediaFusion fallback:", e);
    }

    // 2. Enrich with Torrentio streams and surface Tamil/Multi releases
    const tioStreams = await torrentio.getStreams(imdbId, { preferredLang: "Tamil" });
    tioStreams.forEach(s => {
      const isTamilMovie = this.TAMIL_CATALOG.some(m => (m.imdbId || m.id) === imdbId);
      if (isTamilMovie && !s.languages.includes("Tamil")) {
        s.languages.unshift("Tamil");
        s.languageBadge = s.languages.join(" + ");
      }
      if (s.languages.includes("Tamil") || /tamil/i.test(s.title)) {
        streams.push({
          ...s,
          provider: "1TamilMV",
          indexer: s.indexer.includes("Tamil") ? s.indexer : `1TamilMV • ${s.indexer}`
        });
      }
    });

    return streams;
  }
};
