// script.js — fetch y render básico para /api/news
const API = "/api/news";
const grid = document.getElementById("newsGrid");        // contenedor donde meter cards
const loadMoreBtn = document.getElementById("loadMoreBtn"); // opcional
const errorBox = document.getElementById("newsError");   // elemento para errores

async function fetchBBC() {
  try {
    errorBox?.classList.add("hidden");
    showLoading(true);

    const res = await fetch(API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data?.ok !== true || !Array.isArray(data.articles)) {
      throw new Error(data?.error || "Formato inesperado de la API");
    }

    renderArticles(data.articles);
  } catch (err) {
    console.error("Error cargando noticias:", err);
    if (errorBox) {
      errorBox.textContent = "No se pudieron cargar noticias. Intenta recargar.";
      errorBox.classList.remove("hidden");
    }
  } finally {
    showLoading(false);
  }
}

function renderArticles(articles) {
  if (!grid) return;
  grid.innerHTML = ""; // limpia

  if (!articles.length) {
    grid.innerHTML = `<p>No hay noticias disponibles.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const a of articles) {
    const card = document.createElement("article");
    card.className = "news-card";

    const img = document.createElement("img");
    img.className = "news-img";
    img.alt = a.title || "Imagen noticia";
    img.src = a.urlToImage || "/placeholder.png"; // opcional placeholder

    const h3 = document.createElement("h3");
    h3.className = "news-title";
    h3.textContent = a.title;

    const p = document.createElement("p");
    p.className = "news-desc";
    p.textContent = a.description || "";

    const aLink = document.createElement("a");
    aLink.href = a.url;
    aLink.target = "_blank";
    aLink.rel = "noopener noreferrer";
    aLink.textContent = "Leer en BBC";

    card.appendChild(img);
    card.appendChild(h3);
    card.appendChild(p);
    card.appendChild(aLink);

    fragment.appendChild(card);
  }

  grid.appendChild(fragment);
}

/* utilidades UI */
function showLoading(on) {
  const loader = document.getElementById("newsLoader");
  if (!loader) return;
  loader.style.display = on ? "block" : "none";
}

/* arrancar */
document.addEventListener("DOMContentLoaded", fetchBBC);
