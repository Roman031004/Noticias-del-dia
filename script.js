document.addEventListener("DOMContentLoaded", () => {
  const featuredEl  = document.getElementById("featured");
  const newsGrid    = document.getElementById("newsGrid");
  const cordobaList = document.getElementById("cordobaList");
  const caribeList  = document.getElementById("caribeList");

  const VERCEL = "https://TU-VERCEL-APP.vercel.app/api/news"; // pon tu URL
  const FALLBACK = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent("https://feeds.bbci.co.uk/mundo/rss.xml")}`;

  function showMsg(msg){
    console.warn(msg);
    featuredEl.classList.remove("skeleton");
    featuredEl.querySelector(".featured-title").textContent = "Sin noticias por ahora";
    newsGrid.innerHTML = `<p style="color:var(--muted)">${msg}</p>`;
  }

  function renderFeatured(n){
    if(!n) return;
    featuredEl.classList.remove("skeleton");
    featuredEl.querySelector(".featured-media").style.backgroundImage = `url('${n.img || "https://via.placeholder.com/960x540?text=Noticia"}')`;
    featuredEl.querySelector(".featured-title").textContent = n.title || "Sin título";
    featuredEl.querySelector(".featured-desc").textContent  = n.desc ? n.desc.slice(0,200)+"…" : "Sin descripción.";
    featuredEl.querySelector(".featured-link").href = n.link || "#";
    document.getElementById("featuredMeta").textContent = `${n.source || ""} · ${n.region || ""}`;
  }
  function renderGrid(items){ newsGrid.innerHTML = (items||[]).map(n => `
      <article class="card">
        <img src="${n.img || "https://via.placeholder.com/640x360?text=Noticia"}" alt="">
        <div class="card-body">
          <h4 class="card-title">${n.title}</h4>
          <p class="card-desc">${n.desc ? n.desc.slice(0,140)+"…" : "Sin descripción"}</p>
          <div class="card-meta">
            <span class="badge">${n.region||""}</span>
            <a class="link" href="${n.link}" target="_blank" rel="noopener">Leer más</a>
          </div>
        </div>
      </article>`).join(""); }
  function renderList(el, items){ el.innerHTML = (items||[]).map(n => `
      <a class="item" href="${n.link}" target="_blank" rel="noopener">
        <img src="${n.img || "https://via.placeholder.com/200x120?text=Noticia"}" alt="">
        <div class="info"><p class="title">${n.title}</p><p class="meta">${n.source||""}</p></div>
      </a>`).join(""); }

  async function tryVercel(){
    try {
      const res = await fetch(VERCEL, { cache:"no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (data && (data.featured || data.grid?.length)) {
        renderFeatured(data.featured);
        renderGrid(data.grid || []);
        renderList(cordobaList, data.cordoba || []);
        renderList(caribeList, data.caribe || []);
        return true;
      }
      throw new Error("Vercel devolvió JSON vacío");
    } catch (e){
      console.warn("Vercel falla:", e);
      return false;
    }
  }

  async function tryFallback(){
    try {
      const r = await fetch(FALLBACK, { cache:"no-store" });
      if (!r.ok) throw new Error("Fallback HTTP " + r.status);
      const data = await r.json();
      const items = (data.items || []).map(i => ({ title:i.title, desc:i.description?.replace(/<[^>]*>/g,"")||"", img:i.thumbnail||"", link:i.link, source: data.feed?.title || "RSS" }));
      renderFeatured(items[0] || null);
      renderGrid(items.slice(1, 15));
      renderList(cordobaList, []);
      renderList(caribeList, items.slice(0,6));
      return true;
    } catch (e){
      showMsg("Fallback falló: " + e.message);
      return false;
    }
  }

  (async () => {
    const ok = await tryVercel();
    if (!ok) await tryFallback();
  })();
});
