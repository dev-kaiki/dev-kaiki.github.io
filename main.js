// dev-kaiki portfolio PRO v5 (resilient loading + filters)
const FALLBACK = [
  { slug:"authkit", title:"AuthKit", tagline:"Auth starter: JWT/Refresh, RBAC, Swagger, Prisma",
    repo:"https://github.com/dev-kaiki/authkit",
    live_url:"https://dev-kaiki-authkit.vercel.app",
    docs_url:"https://dev-kaiki-authkit-api.onrender.com/docs",
    stack:["Next.js","NestJS","Prisma","Postgres"] },
  { slug:"filevault", title:"FileVault", tagline:"Upload seguro: presigned URLs + storage abstraction",
    repo:"https://github.com/dev-kaiki/filevault",
    live_url:"https://dev-kaiki-filevault.vercel.app",
    docs_url:"https://dev-kaiki-filevault-api.onrender.com/docs",
    stack:["Next.js","NestJS","Prisma","Postgres"] },
  { slug:"queueops", title:"QueueOps", tagline:"Jobs, retries/backoff, observabilidade e painel",
    repo:"https://github.com/dev-kaiki/queueops",
    live_url:"https://dev-kaiki-queueops.vercel.app",
    docs_url:"https://dev-kaiki-queueops-api.onrender.com/docs",
    stack:["Next.js","NestJS","Prisma","Postgres"] },
  { slug:"reportforge", title:"ReportForge", tagline:"Relatorios + historico + export (PDF/JSON)",
    repo:"https://github.com/dev-kaiki/reportforge",
    live_url:"https://dev-kaiki-reportforge.vercel.app",
    docs_url:"https://dev-kaiki-reportforge-api.onrender.com/docs",
    stack:["Next.js","NestJS","Prisma","Postgres"] },
  { slug:"shoppulse", title:"ShopPulse", tagline:"Dashboard admin com filtros, KPIs e export",
    repo:"https://github.com/dev-kaiki/shoppulse",
    live_url:"https://dev-kaiki-shoppulse.vercel.app",
    docs_url:"https://dev-kaiki-shoppulse-api.onrender.com/docs",
    stack:["Next.js","NestJS","Prisma","Postgres"] },
  { slug:"sprintboard", title:"SprintBoard", tagline:"Kanban estilo Trello com foco em UX e produtividade",
    repo:"https://github.com/dev-kaiki/sprintboard",
    live_url:"https://dev-kaiki-sprintboard.vercel.app",
    docs_url:"https://dev-kaiki-sprintboard-api.onrender.com/docs",
    stack:["Next.js","NestJS","Prisma","Postgres"] },
];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function loadProjects() {
  try {
    const res = await fetch('./projects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('projects.json not array');
    return { data, fallback: false };
  } catch (e) {
    console.warn('projects.json failed, using fallback:', e);
    return { data: FALLBACK, fallback: true };
  }
}

function card(p) {
  const stack = Array.isArray(p.stack) ? p.stack.map(esc).join(' • ') : '';
  const liveBtn = p.live_url ? `<a class="btn" href="${esc(p.live_url)}" target="_blank" rel="noopener">Live</a>` : '';
  const docsBtn = p.docs_url ? `<a class="btn" href="${esc(p.docs_url)}" target="_blank" rel="noopener">Swagger</a>` : '';
  const repoBtn = p.repo ? `<a class="btn btn-outline" href="${esc(p.repo)}" target="_blank" rel="noopener">Repo</a>` : '';
  return `
    <article class="card" data-title="${esc((p.title||p.slug||'').toLowerCase())}" data-stack="${esc((p.stack||[]).join(',').toLowerCase())}" data-tagline="${esc((p.tagline||'').toLowerCase())}">
      <div class="card-top">
        <h3>${esc(p.title || p.slug || 'Projeto')}</h3>
        <p class="muted">${esc(p.tagline || '')}</p>
        ${stack ? `<p class="stack">${stack}</p>` : ''}
      </div>
      <div class="actions">
        ${liveBtn}
        ${docsBtn}
        ${repoBtn}
      </div>
    </article>
  `;
}

function uniqStacks(projects) {
  const set = new Set();
  for (const p of projects) {
    if (Array.isArray(p.stack)) for (const s of p.stack) set.add(String(s));
  }
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function applyFilter() {
  const q = document.querySelector('#q').value.trim().toLowerCase();
  const st = document.querySelector('#stack').value.trim().toLowerCase();
  const sort = document.querySelector('#sort').value;

  const cards = Array.from(document.querySelectorAll('#grid .card'));
  for (const c of cards) {
    const text = (c.dataset.title + ' ' + c.dataset.tagline);
    const hasQ = !q || text.includes(q) || c.dataset.stack.includes(q);
    const hasS = !st || c.dataset.stack.split(',').map(x=>x.trim()).includes(st);
    c.style.display = (hasQ && hasS) ? '' : 'none';
  }

  // sort visible
  const grid = document.querySelector('#grid');
  const visible = cards.filter(c => c.style.display !== 'none');
  visible.sort((a,b)=>{
    if (sort === 'title') return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
    return 0;
  });
  for (const c of visible) grid.appendChild(c);
}

function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved === 'light') root.classList.add('light');

  const btn = document.getElementById('themeBtn');
  const icon = document.getElementById('themeIcon');

  function syncIcon(){
    const light = root.classList.contains('light');
    icon.textContent = light ? '☀️' : '🌙';
  }
  syncIcon();

  btn.addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
    syncIcon();
  });
}

(async function init(){
  document.getElementById('year').textContent = String(new Date().getFullYear());

  initTheme();

  const { data, fallback } = await loadProjects();
  if (fallback) document.getElementById('notice').hidden = false;

  document.getElementById('statCount').textContent = String(data.length);

  // stack select
  const stackSel = document.getElementById('stack');
  for (const s of uniqStacks(data)) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    stackSel.appendChild(opt);
  }

  // render cards
  const grid = document.getElementById('grid');
  grid.innerHTML = data.map(card).join('');

  // filters
  document.getElementById('q').addEventListener('input', applyFilter);
  document.getElementById('stack').addEventListener('change', applyFilter);
  document.getElementById('sort').addEventListener('change', applyFilter);
  applyFilter();
})();
