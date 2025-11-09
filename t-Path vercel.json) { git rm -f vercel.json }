// api/news.js
import fetch from "node-fetch";

const DEFAULT_PAGE_SIZE = 100; // cuántas noticias por página (max 100 en NewsAPI)
const COUNTRY = "co";

function mapArticle(a){
  return {
    title: a.title || "",
    desc: a.description || "",
    link: a.url || "",
    img: a.urlToImage || "https://via.placeholder.com/640x360?text=Noticia",
    source: a.source?.name || "NewsAPI",
    date: a.publishedAt ? Date.parse(a.publishedAt) : 0
  };
}

export default async (req, res) => {
  try {
    const key = process.env.NEWSAPI_KEY;
    if(!key) return res.status(500).json({ error: "Missing NEWSAPI_KEY env var" });

    // page y pageSize vienen del frontend: ?page=1&pageSize=50
    const page = Math.max(1, parseInt(req.query?.page || req.url.split('?page=')[1] || 1));
    const pageSize = Math.min(100, Math.max(10, parseInt(req.query?.pageSize || DEFAULT_PAGE_SIZE)));

    const url = `https://newsapi.org/v2/top-headlines?country=${COUNTRY}&page=${page}&pageSize=${pageSize}&language=es&apiKey=${key}`;

    const r = await fetch(url, { headers: { "User-Agent":"NoticiasAlDia/1.0" } });
    if(!r.ok){
      const txt = await r.text().catch(()=>"");
      return res.status(502).json({ error: "newsapi_bad", status: r.status, detail: txt });
    }

    const data = await r.json();
    const items = (data.articles||[]).map(mapArticle);

    // cache corto en CDN (Vercel) para no llamar tanto al provider
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      page,
      pageSize,
      totalResults: data.totalResults ?? items.length,
      items
    });
  } catch (e) {
    return res.status(500).json({ error: "backend_error", detail: String(e) });
  }
};
