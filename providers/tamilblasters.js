import torrentio from "./torrentio.js";
import tamilmv from "./tamilmv.js";

export default {
  id: "tamilblasters",
  name: "TamilBlasters HD",

  async getHomeFeed() {
    const feed = await tamilmv.getHomeFeed();
    return feed.map(item => ({
      ...item,
      provider: "TamilBlasters"
    }));
  },

  async getStreams(imdbId, movieTitle = "") {
    const rawStreams = await torrentio.getStreams(imdbId, { preferredLang: "Tamil" });
    return rawStreams.map((s, idx) => {
      const langs = s.languages.includes("Tamil") ? s.languages : ["Tamil", ...s.languages];
      return {
        ...s,
        id: `${imdbId}-tb-${idx}`,
        provider: "TamilBlasters",
        indexer: `TamilBlasters • ${s.indexer}`,
        title: `[TamilBlasters] ${s.title}`,
        languages: langs,
        languageBadge: langs.join(" + ")
      };
    });
  }
};
