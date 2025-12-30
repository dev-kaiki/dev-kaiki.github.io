async function loadProjects() {
  const res = await fetch('./projects.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar projects.json');
  return await res.json();
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function card(p) {
  const stack = Array.isArray(p.stack) ? p.stack.map(esc).join(' • ') : '';
  const liveBtn = p.live_url ? `<a class="btn" href="${esc(p.live_url)}" target="_blank" rel="noopener">Live</a>` : '';
  const docsBtn = p.docs_url ? `<a class="btn" href="${esc(p.docs_url)}" target="_blank" rel="noopener">Swagger</a>` : '';
  const repoBtn = p.repo ? `<a class="btn btn-outline" href="${esc(p.repo)}" target="_blank" rel="noopener">Repo</a>` : '';

  return `
    <article class="card">
      <div class="card-top">
        <h3>${esc(p.title || p.slug)}</h3>
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

async function main() {
  const grid = document.getElementById('projects');
  if (!grid) return;

  try {
    const projects = await loadProjects();
    grid.innerHTML = projects.map(card).join('');
  } catch (e) {
    grid.innerHTML = `<div class="error">Erro ao carregar projetos: ${esc(e.message)}</div>`;
    console.error(e);
  }
}

main();
