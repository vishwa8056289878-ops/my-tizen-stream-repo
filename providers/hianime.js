import torrentio from "./torrentio.js";

export default {
  id: "hianime",
  name: "HiAnime",

  async getStreams(imdbId) {
    const streams = await torrentio.getStreams(imdbId);
    return streams.map((s, idx) => ({
      ...s,
      id: `${imdbId}-hianime-${idx}`,
      provider: "HiAnime",
      indexer: "HiAnime / Nyaa",
      languages: ["Japanese", "English", ...s.languages],
      audioLabel: "Japanese • English Sub/Dub"
    }));
  }
};
