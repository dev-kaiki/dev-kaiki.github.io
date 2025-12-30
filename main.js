/* dev-kaiki hub - robust loader + filters + theme */
(function () {
  function qs(id){ return document.getElementById(id); }

  function esc(s){
    s = String(s == null ? "" : s);
    return s.replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function uniq(arr){
    var out = [], seen = {};
    for (var i=0;i<arr.length;i++){
      var k = String(arr[i] || "");
      if (!k || seen[k]) continue;
      seen[k] = 1; out.push(k);
    }
    return out;
  }

  function readFallback(){
    var el = qs("projects-fallback");
    if (!el) return [];
    var txt = (el.textContent || "").trim();
    if (!txt) return [];
    try { return JSON.parse(txt); } catch (e) { return []; }
  }

  function fetchProjects(){
    return fetch("./projects.json?ts=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Falha ao carregar projects.json (HTTP " + res.status + ")");
        return res.json();
      });
  }

  function showError(msg){
    var el = qs("error");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function card(p){
    var stack = Array.isArray(p.stack) ? p.stack : [];
    var stackText = stack.length ? stack.map(esc).join(" • ") : "";

    var live = p.live_url ? '<a class="btn2" href="'+esc(p.live_url)+'" target="_blank" rel="noopener">Live</a>' : "";
    var docs = p.docs_url ? '<a class="btn2" href="'+esc(p.docs_url)+'" target="_blank" rel="noopener">Swagger</a>' : "";
    var repo = p.repo ? '<a class="btn2 btn2--ghost" href="'+esc(p.repo)+'" target="_blank" rel="noopener">Repo</a>' : "";

    return '' +
      '<article class="card">' +
        '<div class="card__top">' +
          '<h3>' + esc(p.title || p.slug) + '</h3>' +
          '<p class="card__tagline">' + esc(p.tagline || "") + '</p>' +
          (stackText ? '<div class="stack">' + stackText + '</div>' : '') +
        '</div>' +
        '<div class="actions">' + live + docs + repo + '</div>' +
      '</article>';
  }

  function render(list){
    var grid = qs("grid");
    if (!grid) return;
    if (!Array.isArray(list) || list.length === 0){
      grid.innerHTML = '<div class="skeleton">Nenhum projeto para exibir.</div>';
      return;
    }
    grid.innerHTML = list.map(card).join("");
  }

  function normalize(p){
    var stack = Array.isArray(p.stack) ? p.stack : [];
    return {
      slug: p.slug || "",
      title: p.title || p.slug || "",
      tagline: p.tagline || "",
      repo: p.repo || "",
      live_url: p.live_url || "",
      docs_url: p.docs_url || "",
      stack: stack,
      _hay: (String(p.slug||"") + " " + String(p.title||"") + " " + String(p.tagline||"") + " " + stack.join(" ")).toLowerCase()
    };
  }

  function initTheme(){
    var root = document.documentElement;
    var btn = qs("themeBtn");
    var icon = qs("themeIcon");
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch(e){}
    var preferDark = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var theme = stored || (preferDark ? "dark" : "light");
    function apply(t){
      if (t === "light") root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
      if (icon) icon.textContent = (t === "light") ? "☀️" : "🌙";
      try { localStorage.setItem("theme", t); } catch(e){}
    }
    apply(theme);
    if (btn){
      btn.addEventListener("click", function(){
        theme = (theme === "light") ? "dark" : "light";
        apply(theme);
      });
    }
  }

  function initFilters(all){
    var q = qs("q");
    var sf = qs("stackFilter");
    var sort = qs("sort");

    var stacks = [];
    for (var i=0;i<all.length;i++){
      if (Array.isArray(all[i].stack)) stacks = stacks.concat(all[i].stack);
    }
    stacks = uniq(stacks).sort(function(a,b){ return a.localeCompare(b); });
    if (sf){
      for (var j=0;j<stacks.length;j++){
        var opt = document.createElement("option");
        opt.value = stacks[j];
        opt.textContent = stacks[j];
        sf.appendChild(opt);
      }
    }

    function apply(){
      var needle = q ? String(q.value||"").trim().toLowerCase() : "";
      var stackPick = sf ? String(sf.value||"") : "";
      var mode = sort ? String(sort.value||"featured") : "featured";

      var out = all.filter(function(p){
        var ok = true;
        if (needle) ok = p._hay.indexOf(needle) !== -1;
        if (ok && stackPick) ok = (p.stack || []).indexOf(stackPick) !== -1;
        return ok;
      });

      if (mode === "az") out.sort(function(a,b){ return a.title.localeCompare(b.title); });
      if (mode === "za") out.sort(function(a,b){ return b.title.localeCompare(a.title); });

      render(out);
    }

    if (q) q.addEventListener("input", apply);
    if (sf) sf.addEventListener("change", apply);
    if (sort) sort.addEventListener("change", apply);

    apply();
  }

  function setYear(){
    var y = qs("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  setYear();
  initTheme();

  var fallback = readFallback().map(normalize);
  if (fallback.length) render(fallback);

  fetchProjects()
    .then(function(list){
      var all = (Array.isArray(list) ? list : []).map(normalize);
      initFilters(all);
    })
    .catch(function(err){
      showError(String(err && err.message ? err.message : err));
      if (fallback.length) initFilters(fallback);
      console.error(err);
    });
})();
