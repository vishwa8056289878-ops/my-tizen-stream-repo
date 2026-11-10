import torrentio from "./torrentio.js";

export default {
  id: "yts",
  name: "YTS Movies",
  apiUrl: "https://yts.mx/api/v2",

  async getHomeFeed() {
    try {
      const res = await fetch(`${this.apiUrl}/list_movies.json?sort_by=download_count&limit=24`);
      const data = await res.json();
      const movies = data?.data?.movies || [];
      return movies.map(m => ({
        id: m.imdb_code,
        imdbId: m.imdb_code,
        title: m.title_english || m.title,
        year: String(m.year || ""),
        rating: String(m.rating || "N/A"),
        poster: m.medium_cover_image,
        background: m.background_image_original || m.large_cover_image,
        description: m.summary || "",
        provider: "YTS Movies",
        language: "English"
      }));
    } catch (err) {
      return [];
    }
  },

  async getStreams(imdbId) {
    try {
      const res = await fetch(`${this.apiUrl}/list_movies.json?query_term=${imdbId}`);
      const data = await res.json();
      const movie = data?.data?.movies?.[0];
      if (!movie || !movie.torrents) return [];

      return movie.torrents.map((t, idx) => {
        const magnet = torrentio.buildMagnet(t.hash, `${movie.title_long} [${t.quality}] [YTS.MX]`);
        return {
          id: `${imdbId}-yts-${idx}`,
          provider: "YTS",
          indexer: `YTS.MX (${t.type.toUpperCase()})`,
          title: `${movie.title_long} [${t.quality}] [${t.type.toUpperCase()}] [YTS.MX]`,
          quality: t.quality === "2160p" ? "4K UHD" : `${t.quality} HD`,
          size: t.size || "1.4 GB",
          seeders: t.seeds || 50,
          languages: ["English"],
          languageBadge: "English",
          infoHash: t.hash,
          magnet,
          url: magnet,
          imdbId
        };
      });
    } catch (err) {
      return [];
    }
  }
};
