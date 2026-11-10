import torrentio from "./torrentio.js";
import tamilmv from "./tamilmv.js";
import tamilblasters from "./tamilblasters.js";
import uhdmovies from "./uhdmovies.js";
import yts from "./yts.js";
import hianime from "./hianime.js";

export default {
  id: "unified",
  name: "Unified IMDb & Magnet Aggregator",

  async getCatalog(genre = "") {
    return torrentio.getIMDbCatalog(genre);
  },

  async getTitleDetails(imdbId) {
    return torrentio.getIMDbDetails(imdbId);
  },

  async getAllMagnetStreams(imdbId, title = "Movie") {
    const [tio, tmv, tb, uhd, ytsList] = await Promise.all([
      torrentio.getStreams(imdbId),
      tamilmv.getStreams(imdbId, title),
      tamilblasters.getStreams(imdbId, title),
      uhdmovies.getStreams(imdbId),
      yts.getStreams(imdbId)
    ]);

    const merged = [...tmv, ...tb, ...uhd, ...ytsList, ...tio];
    const seen = new Set();
    return merged.filter(item => {
      const key = `${item.provider}-${item.infoHash || item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};
