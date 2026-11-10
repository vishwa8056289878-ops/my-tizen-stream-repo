import torrentio from "./torrentio.js";

export default {
  id: "yts",
  name: "YTS BluRay",
  apiUrl: "https://yts.mx/api/v2",

  async getStreams(imdbId) {
    try {
      const res = await fetch(`${this.apiUrl}/list_movies.json?query_term=${encodeURIComponent(imdbId)}`);
      const data = await res.json();
      const movie = data?.data?.movies?.[0];
      if (!movie || !Array.isArray(movie.torrents)) return [];

      return movie.torrents.map((t, idx) => {
        const releaseTitle = `${movie.title_long} [${t.quality}] [${t.type.toUpperCase()}] [YTS.MX]`;
        return {
          id: `${imdbId}-yts-${idx}`,
          provider: "YTS",
          indexer: `YTS.MX ${t.type.toUpperCase()}`,
          title: releaseTitle,
          quality: t.quality === "2160p" ? "4K UHD" : `${t.quality} FHD`,
          size: t.size || "1.5 GB",
          seeders: t.seeds || 80,
          languages: ["English"],
          audioLabel: "English 5.1",
          infoHash: t.hash,
          magnet: torrentio.buildMagnet(t.hash, releaseTitle),
          imdbId
        };
      });
    } catch {
      return [];
    }
  }
};
