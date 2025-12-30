# FIX_PORTFOLIO.ps1  (Windows PowerShell 5.1 OK)
$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$repo = Get-Location
Write-Host "Repo atual: $repo" -ForegroundColor Cyan

# ---------- Conteudos (robustos) ----------
$projectsJson = @'
[
  {
    "slug": "authkit",
    "title": "AuthKit",
    "tagline": "Auth starter: JWT/Refresh, RBAC, Swagger, Prisma",
    "repo": "https://github.com/dev-kaiki/authkit",
    "live_url": "https://dev-kaiki-authkit.vercel.app",
    "docs_url": "https://dev-kaiki-authkit-api.onrender.com/docs",
    "stack": ["Next.js","NestJS","Prisma","Postgres"]
  },
  {
    "slug": "filevault",
    "title": "FileVault",
    "tagline": "Upload seguro: presigned URLs + storage abstraction",
    "repo": "https://github.com/dev-kaiki/filevault",
    "live_url": "https://dev-kaiki-filevault.vercel.app",
    "docs_url": "https://dev-kaiki-filevault-api.onrender.com/docs",
    "stack": ["Next.js","NestJS","Prisma","Postgres"]
  },
  {
    "slug": "queueops",
    "title": "QueueOps",
    "tagline": "Jobs, retries/backoff, observabilidade e painel",
    "repo": "https://github.com/dev-kaiki/queueops",
    "live_url": "https://dev-kaiki-queueops.vercel.app",
    "docs_url": "https://dev-kaiki-queueops-api.onrender.com/docs",
    "stack": ["Next.js","NestJS","Prisma","Postgres"]
  },
  {
    "slug": "reportforge",
    "title": "ReportForge",
    "tagline": "Relatorios + historico + export (PDF/JSON)",
    "repo": "https://github.com/dev-kaiki/reportforge",
    "live_url": "https://dev-kaiki-reportforge.vercel.app",
    "docs_url": "https://dev-kaiki-reportforge-api.onrender.com/docs",
    "stack": ["Next.js","NestJS","Prisma","Postgres"]
  },
  {
    "slug": "shoppulse",
    "title": "ShopPulse",
    "tagline": "Dashboard admin com filtros, KPIs e export",
    "repo": "https://github.com/dev-kaiki/shoppulse",
    "live_url": "https://dev-kaiki-shoppulse.vercel.app",
    "docs_url": "https://dev-kaiki-shoppulse-api.onrender.com/docs",
    "stack": ["Next.js","NestJS","Prisma","Postgres"]
  },
  {
    "slug": "sprintboard",
    "title": "SprintBoard",
    "tagline": "Kanban estilo Trello com foco em UX e produtividade",
    "repo": "https://github.com/dev-kaiki/sprintboard",
    "live_url": "https://dev-kaiki-sprintboard.vercel.app",
    "docs_url": "https://dev-kaiki-sprintboard-api.onrender.com/docs",
    "stack": ["Next.js","NestJS","Prisma","Postgres"]
  }
]
'@

$indexHtml = @'
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>dev-kaiki | Portfolio</title>
  <meta name="description" content="Portfolio de demos fullstack (Next.js + NestJS + Prisma) com deploy one-click (Vercel/Render)." />
  <link rel="stylesheet" href="./styles.css" />
</head>

<body>
  <header class="wrap">
    <div class="hero">
      <div>
        <h1>dev-kaiki</h1>
        <p class="muted">
          Demos fullstack com deploy pronto e links "Live" + "Swagger".
        </p>
        <div class="hero-links">
          <a class="btn btn-outline" href="https://github.com/dev-kaiki" target="_blank" rel="noopener">GitHub</a>
          <a class="btn btn-outline" href="https://www.linkedin.com/in/kaiki-ferreira" target="_blank" rel="noopener">LinkedIn</a>
        </div>
      </div>
    </div>
  </header>

  <main class="wrap">
    <section class="section">
      <div class="section-head">
        <h2>Projetos</h2>
        <p class="muted">Edite <code>projects.json</code> para mudar cards e links.</p>
      </div>

      <div id="error" class="error hidden"></div>
      <div id="grid" class="grid">
        <div class="skeleton">Carregando projetos...</div>
      </div>
    </section>

    <footer class="footer muted">
      <span>© dev-kaiki</span>
    </footer>
  </main>

  <!-- Fallback embutido: se fetch falhar, ainda renderiza -->
  <script id="projects-fallback" type="application/json">
__PROJECTS_JSON__
  </script>

  <script src="./main.js" defer></script>
</body>
</html>
'@

# injeta fallback
$indexHtml = $indexHtml.Replace("__PROJECTS_JSON__", $projectsJson.Trim())

$stylesCss = @'
:root {
  --bg: #0b0f17;
  --card: #101826;
  --text: #e7eefc;
  --muted: #a6b1c3;
  --line: rgba(255,255,255,0.10);
  --btn: #1f6feb;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
a { color: inherit; text-decoration: none; }

.wrap { width: min(1100px, calc(100% - 32px)); margin: 0 auto; }

.hero { padding: 28px 0 10px; display: flex; gap: 18px; align-items: center; border-bottom: 1px solid var(--line); }
h1 { margin: 0; font-size: 36px; letter-spacing: -0.5px; }
.muted { color: var(--muted); }
.hero-links { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }

.section { padding: 22px 0; }
.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
h2 { margin: 0; font-size: 22px; }

.grid { margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 980px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }

.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; min-height: 160px; }
.card h3 { margin: 0 0 6px; font-size: 18px; }
.stack { margin: 8px 0 0; font-size: 13px; color: var(--muted); }

.actions { margin-top: auto; display: flex; gap: 8px; flex-wrap: wrap; padding-top: 12px; }
.btn { background: var(--btn); border: 1px solid transparent; color: white; padding: 8px 10px; border-radius: 10px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; }
.btn:hover { filter: brightness(1.05); }
.btn-outline { background: transparent; border-color: var(--line); color: var(--text); }

.error { margin-top: 14px; background: rgba(255,60,60,0.10); border: 1px solid rgba(255,60,60,0.35); padding: 10px 12px; border-radius: 10px; }
.hidden { display: none; }

.skeleton { opacity: 0.9; color: var(--muted); padding: 14px; border: 1px dashed var(--line); border-radius: 14px; }

.footer { padding: 18px 0 36px; border-top: 1px solid var(--line); }
code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 8px; border: 1px solid var(--line); }
'@

$mainJs = @'
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
'@

# ---------- gravar arquivos ----------
Write-Utf8NoBom (Join-Path $repo "projects.json") $projectsJson
Write-Utf8NoBom (Join-Path $repo "index.html") $indexHtml
Write-Utf8NoBom (Join-Path $repo "styles.css") $stylesCss
Write-Utf8NoBom (Join-Path $repo "main.js") $mainJs

# opcional: evita Jekyll
$nojekyll = Join-Path $repo ".nojekyll"
if (!(Test-Path $nojekyll)) { Write-Utf8NoBom $nojekyll "" }

Write-Host "Arquivos atualizados com UTF-8 sem BOM." -ForegroundColor Green

# ---------- git commit + push ----------
& git add .
& git status --porcelain | Out-Host

$hasChanges = ((& git status --porcelain).Length -gt 0)
if ($hasChanges) {
  & git commit -m "fix: portfolio render projects (robust)"
  & git push
  Write-Host "Push feito. Aguarde 1-3 min e abra https://dev-kaiki.github.io" -ForegroundColor Green
} else {
  Write-Host "Sem mudancas para commitar." -ForegroundColor Yellow
}