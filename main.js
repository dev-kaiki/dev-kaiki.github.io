const state = { projects: [], activeTag: null, query: "" };

function el(tag, attrs={}, children=[]) {
  const node = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const child of children) node.append(child);
  return node;
}

function renderTags() {
  const tagRow = document.getElementById("tagRow");
  tagRow.innerHTML = "";

  const tags = new Set();
  state.projects.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
  const list = ["Todos", ...Array.from(tags).sort((a,b)=>a.localeCompare(b))];

  list.forEach(tag => {
    const isActive = (tag === "Todos" && !state.activeTag) || state.activeTag === tag;
    tagRow.append(
      el("div", {
        class: "tag" + (isActive ? " active" : ""),
        onclick: () => {
          state.activeTag = (tag === "Todos") ? null : tag;
          render();
        }
      }, [document.createTextNode(tag)])
    );
  });
}

function projectMatches(p) {
  const q = state.query.trim().toLowerCase();
  const hay = [p.title, p.description, p.stack, (p.tags||[]).join(" ")].join(" ").toLowerCase();
  const okQuery = !q || hay.includes(q);
  const okTag = !state.activeTag || (p.tags || []).includes(state.activeTag);
  return okQuery && okTag;
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const items = state.projects.filter(projectMatches);
  if (!items.length) {
    grid.append(el("div", { class: "card" }, [
      el("h4", {}, [document.createTextNode("Nada encontrado")]),
      el("p", {}, [document.createTextNode("Tente outra busca ou remova o filtro de tag.")]),
    ]));
    return;
  }

  items.forEach(p => {
    const meta = el("div", { class: "meta" }, []);
    (p.tags || []).slice(0, 6).forEach(t => meta.append(el("span", { class:"pill" }, [document.createTextNode(t)])));
    if (p.stack) meta.append(el("span", { class:"pill" }, [document.createTextNode(p.stack)]));

    const actions = el("div", { class:"actions" }, []);
    if (p.demoUrl) actions.append(el("a", { class:"btn primary", href: p.demoUrl, target:"_blank", rel:"noreferrer" }, [document.createTextNode("Live Demo")]));
    if (p.repoUrl) actions.append(el("a", { class:"btn", href: p.repoUrl, target:"_blank", rel:"noreferrer" }, [document.createTextNode("Repo")]));
    if (p.docsUrl) actions.append(el("a", { class:"btn", href: p.docsUrl, target:"_blank", rel:"noreferrer" }, [document.createTextNode("Docs")]));

    grid.append(el("div", { class:"card" }, [
      el("h4", {}, [document.createTextNode(p.title)]),
      el("p", {}, [document.createTextNode(p.description)]),
      meta,
      actions
    ]));
  });
}

function render() {
  renderTags();
  renderGrid();
}

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();
  const res = await fetch("projects.json", { cache: "no-store" });
  state.projects = await res.json();

  document.getElementById("search").addEventListener("input", (e) => {
    state.query = e.target.value || "";
    render();
  });

  render();
}

init().catch(console.error);
