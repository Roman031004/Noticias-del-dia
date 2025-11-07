import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

const SOURCES = [
  { name: "El Meridiano",  region: "Córdoba",  weight: 3, rss: "https://www.elmeridiano.co/feed" },
  { name: "Zenú Radio",    region: "Córdoba",  weight: 2, rss: "https://zenuradio.com/feed/" },
  { name: "El Tiempo",     region: "Colombia", weight: 1, rss: "https://www.eltiempo.com/rss/colombia.xml" },
  { name: "El Espectador", region: "Colombia", weight: 1, rss: "https://www.elespectador.com/colombia/feed/" },
  { name: "El Colombiano", region: "Colombia", weight: 1, rss: "https://www.elcolombiano.com/rss/colombia.xml" }
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true
});

const TIMEOUT_MS = 6000;

function clean(s = "") {
  return String(s)
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickImage(item) {
  // WordPress: enclosure url
  const encl = item.enclosure?.url || item.enclosure?.["@_url"];
  if (encl) return encl;
  // media:content / media:thumbnail
  const media = item["media:content"]?.url || item["media:thumbnail"]?.url;
  if (media) return media;
  return "";
}

function toEpoch(d) {
  const t = Date.parse(d || "");
  return Number.isFinite(t) ? t : 0;
}

async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 NewsAggregator" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    return text;
  } finally {
    clearTimeout(id);
  }
}

async function fetchFeed(src, maxItems = 12) {
  try {
    const xml = await fetchWithTimeout(src.rss);
    const data = parser.parse(xml);
    const channel = data.rss?.channel || data.channel || data;
    const items = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);

    const mapped = items.slice(0, maxItems).map((it) => ({
      source: src.name,
      region: src.region,
      weight: src.weight,
      title: clean(it.title),
      link: clean(it.link),
      desc: clean(it.description || it.summary || ""),
      img: pickImage(it),
      date: toEpoch(it.pubDate || it.updated)
    }));
    return mapped;
  } catch (e) {
    // fall back vacío en caso de error
    return [];
  }
}

export default async function handler(req, res) {
  try {
    // Trae todos en paralelo con timeout interno
    const results = await Promise.all(SOURCES.map((s) => fetchFeed(s)));
    let all = results.flat();

    // Enriquecer Zenú: si no hay imagen, intentar scrappear og:image (con timeout y sin bloquear todo)
    const zenuTargets = all.filter((x) => x.source === "Zenú Radio" && !x.img).slice(0, 8);
    await Promise.all(zenuTargets.map(async (x) => {
      try {
        const html = await fetchWithTimeout(x.link, 3000);
        const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (m) x.img = m[1];
      } catch {}
    }));

    // Fallback visual
    all = all.map((x) => ({
      ...x,
      img: x.img || "https://via.placeholder.com/640x360?text=Noticia"
    }));

    // Orden: Córdoba primero (weight), luego fecha desc
    all.sort((a, b) => (b.weight - a.weight) || (b.date - a.date));

    // Limita la respuesta total para hacerla ágil
    const featured = all[0] || null;
    const grid = all.slice(1, 25);
    const cordoba = all.filter((x) => /córdoba/i.test(x.region)).slice(0, 10);
    const caribe  = all.filter((x) => /(caribe|colombia)/i.test(x.region) && !/córdoba/i.test(x.region)).slice(0, 10);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({ featured, grid, cordoba, caribe });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
