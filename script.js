document.addEventListener("DOMContentLoaded", () => {
  const featuredEl  = document.getElementById("featured");
  const newsGrid    = document.getElementById("newsGrid");
  const cordobaList = document.getElementById("cordobaList");
  const caribeList  = document.getElementById("caribeList");

  const API = "https://tu-app.vercel.app/api/news"; // <-- pon aquí tu URL de Vercel

  function renderFeatured(n){
    if(!n) return;
    featuredEl.classList.remove("skeleton");
    featuredEl.querySelector(".featured-media").style.backgroundImage = `url('${n.img}')`;
    featuredEl.querySelector(".featured-title").textContent = n.title || "Sin título";
    featuredEl.querySelector(".featured-desc").textContent  = n.desc ? n.desc.slice(0,200)+"…" : "Sin descripción.";
    featuredEl.querySelector(".featured-link").href = n.link || "#";
    document.getElementById("featuredMeta").textContent = `${n.source} · ${n.region}`;
  }

  function renderGrid(items){
    newsGrid.innerHTML = items.map(n => `
      <article class="card">
        <img src="${n.img}" alt="">
        <div class="card-body">
          <h4 class="card-title">${n.title}</h4>
          <p class="card-desc">${n.desc ? n.desc.slice(0,140)+"…" : "Sin descripción"}</p>
          <div class="card-meta">
            <span class="badge">${n.region}</span>
            <a class="link" href="${n.link}" target="_blank" rel="noopener">Leer más</a>
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderList(el, items){
    el.innerHTML = items.map(n => `
      <a class="item" href="${n.link}" target="_blank" rel="noopener">
        <img src="${n.img}" alt="">
        <div class="info">
          <p class="title">${n.title}</p>
          <p class="meta">${n.source}</p>
        </div>
      </a>
    `).join("");
  }

  async function loadAll(){
    try {
      const res = await fetch(API, { cache: "no-store" });
      if(!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      if (!data || (!data.featured && !data.grid?.length)) {
        featuredEl.classList.remove("skeleton");
        featuredEl.querySelector(".featured-title").textContent = "Sin noticias por ahora";
        newsGrid.innerHTML = "<p>No se pudieron cargar noticias.</p>";
        return;
      }

      renderFeatured(data.featured);
      renderGrid(data.grid || []);
      renderList(cordobaList, data.cordoba || []);
      renderList(caribeList,  data.caribe || []);
    } catch (e) {
      console.error("Fallo agregador:", e);
      featuredEl.classList.remove("skeleton");
      featuredEl.querySelector(".featured-title").textContent = "Sin noticias por ahora";
      newsGrid.innerHTML = "<p>Error de conexión. Intenta más tarde.</p>";
    }
  }

  loadAll();
});
