import torrentio from "./torrentio.js";

export default {
  id: "hianime",
  name: "HiAnime",

  ANIME_CATALOG: [
    { id: "tt0988824", title: "Naruto: Shippuden", year: "2007", rating: "8.7", poster: "https://images.metahub.space/poster/medium/tt0988824/img", language: "Japanese / English" },
    { id: "tt2560140", title: "Attack on Titan", year: "2013", rating: "9.1", poster: "https://images.metahub.space/poster/medium/tt2560140/img", language: "Japanese / English" },
    { id: "tt9335498", title: "Demon Slayer: Kimetsu no Yaiba", year: "2019", rating: "8.6", poster: "https://images.metahub.space/poster/medium/tt9335498/img", language: "Japanese / English / Tamil" },
    { id: "tt12343534", title: "Jujutsu Kaisen", year: "2020", rating: "8.5", poster: "https://images.metahub.space/poster/medium/tt12343534/img", language: "Japanese / English" },
    { id: "tt5311514", title: "Your Name (Kimi no Na wa)", year: "2016", rating: "8.4", poster: "https://images.metahub.space/poster/medium/tt5311514/img", language: "Japanese / English" },
    { id: "tt11032374", title: "Demon Slayer: Mugen Train", year: "2020", rating: "8.2", poster: "https://images.metahub.space/poster/medium/tt11032374/img", language: "Japanese / English / Tamil" }
  ],

  async getHomeFeed() {
    return this.ANIME_CATALOG.map(a => ({
      ...a,
      imdbId: a.id,
      provider: "HiAnime"
    }));
  },

  async getStreams(imdbId) {
    const streams = await torrentio.getStreams(imdbId);
    return streams.map(s => ({
      ...s,
      provider: "HiAnime",
      languages: s.languages.includes("Japanese") ? s.languages : ["Japanese", ...s.languages],
      languageBadge: `Japanese + ${s.languageBadge}`
    }));
  }
};
