import torrentio from "./torrentio.js";

export default {
  id: "uhdmovies",
  name: "UHDMovies 4K",

  async getStreams(imdbId) {
    const streams = await torrentio.getStreams(imdbId);
    return streams
      .filter(s => /2160p|4k|uhd|1080p|hdr|dv|remux/i.test(`${s.quality} ${s.title}`))
      .map((s, idx) => ({
        ...s,
        id: `${imdbId}-uhd-${idx}`,
        provider: "UHDMovies 4K",
        indexer: `UHDMovies • ${s.indexer}`,
        quality: /2160p|4k|uhd/i.test(s.title) ? "4K UHD HDR" : s.quality
      }));
  }
};
