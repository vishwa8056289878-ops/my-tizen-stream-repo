import torrentio from "./torrentio.js";

export default {
  id: "uhdmovies",
  name: "UHDMovies 4K",

  async getHomeFeed() {
    const feed = await torrentio.getHomeFeed();
    return feed.map(item => ({
      ...item,
      provider: "UHDMovies 4K",
      qualityBadge: "4K UHD"
    }));
  },

  async getStreams(imdbId) {
    const all = await torrentio.getStreams(imdbId);
    const uhd = all.filter(s => /4k|2160p|1080p|uhd|remux|hdr|dv/i.test(`${s.quality} ${s.title}`));
    return (uhd.length > 0 ? uhd : all).map((s, idx) => ({
      ...s,
      id: `${imdbId}-uhd-${idx}`,
      provider: "UHDMovies 4K",
      indexer: `UHDMovies • ${s.indexer}`,
      quality: /2160p|4k/i.test(s.title) ? "4K UHD HDR" : s.quality
    }));
  }
};
