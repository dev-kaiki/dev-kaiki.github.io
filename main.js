(function () {
  function esc(s) {
    s = String(s == null ? "" : s);
    return s.replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function showError(msg) {
    var el = document.getElementById("error");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function card(p) {
    var title = p.title || p.slug;
    var tagline = p.tagline || "";
    var stack = Array.isArray(p.stack) ? p.stack.map(esc).join(" | ") : "";

    var liveBtn = p.live_url ? '<a class="btn" href="' + esc(p.live_url) + '" target="_blank" rel="noopener">Live</a>' : "";
    var docsBtn = p.docs_url ? '<a class="btn" href="' + esc(p.docs_url) + '" target="_blank" rel="noopener">Swagger</a>' : "";
    var repoBtn = p.repo ? '<a class="btn btn-outline" href="' + esc(p.repo) + '" target="_blank" rel="noopener">Repo</a>' : "";

    return (
      '<article class="card">' +
        '<div class="card-top">' +
          "<h3>" + esc(title) + "</h3>" +
          '<p class="muted">' + esc(tagline) + "</p>" +
          (stack ? '<p class="stack">' + stack + "</p>" : "") +
        "</div>" +
        '<div class="actions">' + liveBtn + docsBtn + repoBtn + "</div>" +
      "</article>"
    );
  }

  function readFallback() {
    var el = document.getElementById("projects-fallback");
    if (!el) return null;
    var txt = (el.textContent || "").trim();
    if (!txt) return null;
    try { return JSON.parse(txt); } catch (e) { return null; }
  }

  function fetchProjects() {
    return fetch("./projects.json?ts=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Falha ao carregar projects.json (HTTP " + res.status + ")");
        return res.json();
      });
  }

  function render(list) {
    var grid = document.getElementById("grid");
    if (!grid) return;
    if (!Array.isArray(list) || list.length === 0) {
      grid.innerHTML = '<div class="skeleton">Nenhum projeto encontrado (lista vazia).</div>';
      return;
    }
    grid.innerHTML = list.map(card).join("");
  }

  // Start
  var fallback = readFallback();
  if (fallback) render(fallback);

  fetchProjects()
    .then(function (list) { render(list); })
    .catch(function (err) {
      // Mantem o fallback renderizado, mas mostra erro
      showError(String(err && err.message ? err.message : err));
      console.error(err);
    });
})();