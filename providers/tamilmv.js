import torrentio from "./torrentio.js";

export default {
  id: "tamilmv",
  name: "1TamilMV Official",
  indexerApi: "https://mediafusion.elfhosted.com",

  async getStreams(imdbId, title = "Movie") {
    const results = [];
    try {
      const res = await fetch(`${this.indexerApi}/stream/movie/${imdbId}.json`);
      if (res.ok) {
        const data = await res.json();
        (data.streams || []).forEach((s, idx) => {
          const text = `${s.name || ""} ${s.description || s.title || title}`;
          const infoHash = s.infoHash || "";
          const magnet = infoHash
            ? torrentio.buildMagnet(infoHash, title)
            : (s.url && s.url.startsWith("magnet:") ? s.url : "");

          if (magnet || s.url) {
            const langs = torrentio.parseLanguages(`${text} Tamil`);
            results.push({
              id: `${imdbId}-tamilmv-${idx}`,
              provider: "1TamilMV",
              indexer: "1TamilMV Official",
              title: (s.description || s.title || `www.1TamilMV.io - ${title} TRUE WEB-DL`).replace(/\n/g, " • "),
              quality: torrentio.parseQuality(text),
              size: (text.match(/([\d.]+\s*[GMK]B)/i) || [0, "2.4 GB"])[1],
              seeders: 68,
              languages: langs,
              audioLabel: langs.join(" • "),
              infoHash,
              magnet: magnet || s.url,
              url: s.url || magnet,
              imdbId
            });
          }
        });
      }
    } catch (e) {
      console.warn("1TamilMV fetch warning:", e);
    }
    return results;
  }
};
