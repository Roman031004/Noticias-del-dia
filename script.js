// script.js
const API = "/api/news"; // endpoint en Vercel (usa NEWSAPI_KEY en env vars)
const PAGE_SIZE = 100;   // pedir 100 por página (máx NewsAPI)
let PAGE = 1;
let loading = false;
let totalResults = 0;
let query = "";

const grid = document.getElementById("newsGrid");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadingEl = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");
const infiniteToggle = document.getElementById("infiniteToggle");

function escapeHtml(s){ return (s||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function showLoading(v=true){
  loading = v;
  loadingEl.style.display = v ? "block" : "none";
  if(v) loadMoreBtn.style.display = "none";
}

function renderItems(items, append=false){
  if(!append) grid.innerHTML = "";
  const html = items.map(i => `
    <article class="card">
      <img src="${escapeHtml(i.img || 'https://via.placeholder.com/640x360?text=Noticia')}" alt="">
      <div class="card-body">
        <h3>${escapeHtml(i.title)}</h3>
        <p>${escapeHtml((i.desc||"").slice(0,180))}</p>
        <div class="meta">
          <small style="color:var(--muted)">${escapeHtml(i.source || "")}</small>
          <a href="${escapeHtml(i.link || '#')}" target="_blank" rel="noopener">Leer</a>
        </div>
      </div>
    </article>
  `).join("");
  grid.insertAdjacentHTML('beforeend', html);
}

async function fetchPage(page = 1, pageSize = PAGE_SIZE, q = "") {
  const qp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if(q) qp.set("q", q);
  showLoading(true);
  try {
    const res = await fetch(`${API}?${qp.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text().catch(()=>"");
      throw new Error(`HTTP ${res.status} ${txt}`);
    }
    const data = await res.json();
    return data;
  } finally {
    showLoading(false);
  }
}

async function loadInitial(){
  PAGE = 1;
  const data = await fetchPage(PAGE, PAGE_SIZE, query).catch(err => { console.error(err); alert("No se pudieron cargar noticias."); return null; });
  if(!data) return;
  renderItems(data.items || []);
  totalResults = data.totalResults || (data.items||[]).length;
  updateControls();
}

async function loadMore(){
  if (loading) return;
  if (PAGE * PAGE_SIZE >= (totalResults || Infinity)) return;
  PAGE++;
  const data = await fetchPage(PAGE, PAGE_SIZE, query).catch(err => { console.error(err); return null; });
  if (!data) return;
  renderItems(data.items || [], true);
  totalResults = data.totalResults || totalResults;
  updateControls();
}

function updateControls(){
  if ((PAGE * PAGE_SIZE) < (totalResults || Infinity)) {
    loadMoreBtn.style.display = "inline-block";
  } else {
    loadMoreBtn.style.display = "none";
  }
}

let scrollDebounce = 0;
window.addEventListener("scroll", () => {
  if (!infiniteToggle.checked) return;
  if (loading) return;
  if (Date.now() - scrollDebounce < 400) return;
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 600;
  if (nearBottom) {
    scrollDebounce = Date.now();
    loadMore();
  }
});

loadMoreBtn.addEventListener("click", loadMore);

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    query = searchInput.value.trim();
    loadInitial();
  }
});

// Inicio inicial
document.addEventListener("DOMContentLoaded", () => {
  // Opcional: si quieres arrancar ya cargando, descomenta:
  loadInitial();
});
