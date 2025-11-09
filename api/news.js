// api/news.js
export default async function handler(req, res) {
  const API_KEY = process.env.NEWSAPI_KEY; // variable de entorno en Vercel
  const BBC_URL = `https://newsapi.org/v2/top-headlines?sources=bbc-news&pageSize=100&apiKey=${API_KEY}`;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  try {
    const response = await fetch(BBC_URL);
    const data = await response.json();

    if (data.status !== "ok") {
      return res.status(500).json({ error: data.message || "Error obteniendo noticias de BBC" });
    }

    // Filtramos artículos que no tengan imagen o título
    const filtered = data.articles.filter(a => a.urlToImage && a.title);

    res.status(200).json({ ok: true, articles: filtered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
