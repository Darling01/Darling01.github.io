// ===== carousel.js (multi-items; abre PDF al hacer clic) =====

// Edita aquí tus publicaciones (miniatura cuadrada + PDF/HTM)
const CBAS_SLIDES = [
  { src: "img/Queso.png",  
    caption: "Me visita un fantasma que vende queso", 
    href: "posts/Abuela-queso.pdf"},
  // agrega más {src, caption, href} si quieres
];

// Opciones
const CBAS_OPTIONS = {
  autoplayMs: 5000,   // 0 para desactivar
  pauseOnHover: true,
  withDots: true,
  keyboard: true,
  swipe: true
};

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("portada");
    if (!container) return;
    renderCarousel(container, CBAS_SLIDES, CBAS_OPTIONS);
  });

  function renderCarousel(container, slides, opts) {
    container.innerHTML = `
      <div class="cbas-carousel" aria-label="Carrusel de publicaciones">
        <div class="cbas-viewport">
          <div class="cbas-track">
            ${slides.map(s => `
              <div class="cbas-slide">
                ${s.href
                  ? `<a class="cbas-card" href="${encodeURI(s.href)}" target="_blank" rel="noopener">`
                  : `<div class="cbas-card">`
                }
                  <img class="cbas-img" src="${s.src}" alt="${escapeHtml(s.alt || s.caption || "")}">
                  ${s.caption ? `<div class="cbas-title">${escapeHtml(s.caption)}</div>` : ""}
                ${s.href ? `</a>` : `</div>`}
              </div>
            `).join("")}
          </div>
          <button class="cbas-btn prev" aria-label="Anterior">&#10094;</button>
          <button class="cbas-btn next" aria-label="Siguiente">&#10095;</button>
        </div>
        ${opts.withDots ? `<div class="cbas-dots"></div>` : ""}
      </div>
    `;

    const root     = container.querySelector(".cbas-carousel");
    const viewport = root.querySelector(".cbas-viewport");
    const track    = root.querySelector(".cbas-track");
    const prev     = root.querySelector(".cbas-btn.prev");
    const next     = root.querySelector(".cbas-btn.next");
    const dotsWrap = root.querySelector(".cbas-dots");

    // Páginas (multi-items controlado por CSS con --cbas-spv)
    let page = 0;
    let pages = 1;
    let autoTimer = null;

    function pagesCount() {
      // calcula cuántas "pantallas" hay según ancho visible
      const slide = root.querySelector(".cbas-slide");
      if (!slide) return 1;
      const spv = getComputedStyle(root).getPropertyValue("--cbas-spv") || "1";
      const n = Math.max(1, Math.ceil(slides.length / parseFloat(spv)));
      return n;
    }

    function layout() {
      pages = pagesCount();
      buildDots();
      page = Math.min(page, pages - 1);
      update();
      updateDots();
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (let i = 0; i < pages; i++) {
        const b = document.createElement("button");
        b.className = "cbas-dot";
        b.setAttribute("aria-label", `Ir a página ${i + 1}`);
        b.addEventListener("click", () => go(i));
        dotsWrap.appendChild(b);
      }
    }

    function update() {
      const pageWidth = viewport.clientWidth;
      track.style.transform = `translateX(-${page * pageWidth}px)`;
    }

    function updateDots() {
      if (!dotsWrap) return;
      Array.from(dotsWrap.children).forEach((d, i) =>
        d.classList.toggle("active", i === page)
      );
    }

    function go(p) {
      page = (p + pages) % pages;
      update();
      updateDots();
    }

    // Eventos
    prev.addEventListener("click", () => go(page - 1));
    next.addEventListener("click", () => go(page + 1));

    if (opts.pauseOnHover) {
      viewport.addEventListener("mouseenter", stopAutoplay);
      viewport.addEventListener("mouseleave", startAutoplay);
    }

    if (opts.keyboard) {
      document.addEventListener("keydown", (e) => {
        if (!isInViewport(root)) return;
        if (e.key === "ArrowLeft")  go(page - 1);
        if (e.key === "ArrowRight") go(page + 1);
      });
    }

    if (opts.swipe) {
      let startX = 0, dx = 0, dragging = false;
      viewport.addEventListener("touchstart", (e) => {
        dragging = true; startX = e.touches[0].clientX; dx = 0; stopAutoplay();
      }, { passive: true });
      viewport.addEventListener("touchmove", (e) => {
        if (!dragging) return; dx = e.touches[0].clientX - startX;
      }, { passive: true });
      viewport.addEventListener("touchend", () => {
        dragging = false;
        if (Math.abs(dx) > 40) (dx < 0) ? go(page + 1) : go(page - 1);
        startAutoplay();
      });
    }

    document.addEventListener("visibilitychange", () => {
      document.hidden ? stopAutoplay() : startAutoplay();
    });

    // Resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    });

    function startAutoplay() {
      if (!opts.autoplayMs) return;
      stopAutoplay();
      autoTimer = setInterval(() => go(page + 1), opts.autoplayMs);
    }
    function stopAutoplay() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    }

    // Init
    layout();
    startAutoplay();
  }

  // Utils
  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.right > 0 &&
           r.left < (window.innerWidth || document.documentElement.clientWidth) &&
           r.top  < (window.innerHeight || document.documentElement.clientHeight);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }
})();
