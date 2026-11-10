import torrentio from "./torrentio.js";

export default {
  id: "tamilblasters",
  name: "TamilBlasters HD",

  async getStreams(imdbId, title = "Movie") {
    const baseStreams = await torrentio.getStreams(imdbId);
    return baseStreams
      .filter(s => s.languages.includes("Tamil") || /tamil|multi|dual/i.test(s.title))
      .map((s, idx) => ({
        ...s,
        id: `${imdbId}-tb-${idx}`,
        provider: "TamilBlasters",
        indexer: "TamilBlasters Official",
        title: `[TamilBlasters] ${s.title}`,
        languages: s.languages.includes("Tamil") ? s.languages : ["Tamil", ...s.languages],
        audioLabel: s.languages.includes("Tamil") ? s.audioLabel : `Tamil • ${s.audioLabel}`
      }));
  }
};
