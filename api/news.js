// api/news.js — handler mínimo de prueba
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({ ok: true, now: new Date().toISOString(), note: "handler mínimo OK" });
}
