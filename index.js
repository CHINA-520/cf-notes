export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // ====== 详情页：/?id=xxx ======
    if (pathname === "/" && searchParams.get("id")) {
      const id = searchParams.get("id");
      const note = await env.NOTES.get(id);
      if (!note) return new Response("Not Found", { status: 404 });
      const data = JSON.parse(note);

      return new Response(
        `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(data.title || "无标题")}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin:0;
    padding:1.5rem;
    font-family:"SimSun","Songti SC",serif;
    background:#fdfaf2;
    color:#2b2118;
  }
  .page {
    max-width:800px;
    margin:0 auto;
    background:#fffcf5;
    border:1px solid #d8c7a3;
    border-radius:8px;
    padding:1.5rem 1.8rem;
    box-shadow:0 10px 25px rgba(0,0,0,0.12);
  }
  .title {
    text-align:center;
    font-size:1.6rem;
    letter-spacing:0.25em;
    margin-bottom:0.8rem;
  }
  .meta {
    text-align:center;
    font-size:0.85rem;
    color:#8a7a68;
    margin-bottom:1rem;
  }
  .tag {
    display:inline-block;
    padding:0.1rem 0.5rem;
    border-radius:999px;
    border:1px solid #c9b89a;
    margin:0 0.2rem;
    font-size:0.8rem;
  }
  .content p { text-indent:2em; margin:0.4rem 0; }
  .back {
    display:inline-block;
    margin-bottom:0.8rem;
    font-size:0.85rem;
    color:#7a5b3a;
    text-decoration:none;
  }
  .theme-toggle {
    position:fixed;
    right:1rem;
    top:1rem;
    padding:0.3rem 0.8rem;
    border-radius:999px;
    border:1px solid #c9b89a;
    background:#fffaf0;
    font-size:0.8rem;
    cursor:pointer;
  }
  body.dark { background:#111; color:#f5f0e6; }
  body.dark .page { background:#1b1815; border-color:#bda57a; }
  body.dark .meta { color:#c0b09c; }
  body.dark .tag { border-color:#bda57a; color:#f5f0e6; }
  body.dark .theme-toggle { background:#1b1815; color:#f5f0e6; border-color:#bda57a; }
</style>
</head>
<body>
<button class="theme-toggle" id="themeToggle">切换主题</button>
<div class="page">
  <a href="/" class="back">← 返回首页</a>
  <div class="title">${escapeHtml(data.title || "无标题")}</div>
  <div class="meta">
    ${
      (data.tags && data.tags.length)
        ? data.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")
        : "无标签"
    }
  </div>
  <div class="content" id="content"></div>
</div>
<script>
  const raw = ${JSON.stringify(data.content || "")};
  document.getElementById("content").innerHTML = raw
    .split(/\\n\\n+/)
    .map(p => "<p>" + p.replace(/\\n/g,"<br>") + "</p>")
    .join("");

  const theme = localStorage.getItem("theme") || "light";
  if (theme === "dark") document.body.classList.add("dark");
  document.getElementById("themeToggle").onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  };
</script>
</body>
</html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // ====== 首页：编辑器 + 列表 ======
    if (pathname === "/" && request.method === "GET") {
      return new Response(
        `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8" />
<title>极简手记 · 宣纸</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin:0;
    font-family:"SimSun","Songti SC",serif;
    background:#fdfaf2;
    color:#2b2118;
  }
  .shell {
    max-width:1100px;
    margin:0 auto;
    padding:1.5rem 1.2rem 2.5rem;
  }
  header { text-align:center; margin-bottom:1rem; }
  header h1 {
    margin:0;
    font-size:2rem;
    letter-spacing:0.3em;
  }
  header p {
    margin:0.4rem 0 0;
    font-size:0.9rem;
    color:#8a7a68;
  }
  .top-bar {
    margin-top:1rem;
    display:flex;
    gap:0.8rem;
    align-items:center;
  }
  .top-bar input {
    flex:1;
    padding:0.35rem 0.6rem;
    border-radius:999px;
    border:1px solid #c9b89a;
    background:#fffcf5;
    font-family:"SimSun","Songti SC",serif;
  }
  .tag-filter {
    display:flex;
    flex-wrap:wrap;
    gap:0.3rem;
    font-size:0.8rem;
  }
  .tag-pill {
    padding:0.1rem 0.5rem;
    border-radius:999px;
    border:1px solid #c9b89a;
    background:#fffaf0;
    cursor:pointer;
  }
  .tag-pill.active {
    background:#7a5b3a;
    color:#fdfaf2;
    border-color:#7a5b3a;
  }
  .theme-toggle {
    padding:0.3rem 0.8rem;
    border-radius:999px;
    border:1px solid #c9b89a;
    background:#fffaf0;
    font-size:0.8rem;
    cursor:pointer;
  }
  main {
    margin-top:1.2rem;
    display:grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
    gap:1rem;
  }
  .panel {
    background:#fffcf5;
    border-radius:8px;
    border:1px solid #d8c7a3;
    padding:1rem 1.1rem 1.2rem;
  }
  .panel h2 {
    margin:0 0 0.6rem;
    font-size:1.1rem;
    letter-spacing:0.15em;
  }
  .field-label {
    font-size:0.8rem;
    color:#8a7a68;
    margin:0.3rem 0 0.15rem;
  }
  input[type="text"], textarea {
    width:100%;
    box-sizing:border-box;
    padding:0.35rem 0.5rem;
    border-radius:6px;
    border:1px solid #c9b89a;
    background:#fffdf7;
    font-family:"SimSun","Songti SC",serif;
    font-size:0.9rem;
  }
  textarea { height:200px; resize:vertical; }
  .hint { font-size:0.75rem; color:#a08c76; }
  .editor-row {
    display:grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap:0.6rem;
    margin-top:0.4rem;
  }
  #preview {
    border-radius:6px;
    border:1px solid #c9b89a;
    padding:0.4rem 0.5rem;
    background:#fffdf7;
    font-size:0.9rem;
    overflow:auto;
  }
  #preview p { margin:0.3rem 0; text-indent:2em; }
  .btn-row {
    margin-top:0.5rem;
    display:flex;
    gap:0.5rem;
    align-items:center;
  }
  button {
    padding:0.35rem 0.9rem;
    border-radius:999px;
    border:none;
    cursor:pointer;
    font-family:"SimSun","Songti SC",serif;
    font-size:0.85rem;
  }
  .btn-primary { background:#7a5b3a; color:#fdfaf2; }
  .btn-ghost {
    background:transparent;
    border:1px solid #c9b89a;
    color:#7a5b3a;
  }
  .autosave-status {
    font-size:0.75rem;
    color:#a08c76;
  }
  .note-group-title {
    font-size:0.85rem;
    color:#8a7a68;
    margin:0.3rem 0;
  }
  .note-card {
    border-radius:6px;
    border:1px solid #d8c7a3;
    padding:0.45rem 0.55rem;
    margin-bottom:0.4rem;
    background:#fffdf7;
  }
  .note-header {
    display:flex;
    justify-content:space-between;
    gap:0.4rem;
    align-items:center;
  }
  .note-title {
    font-size:0.9rem;
    font-weight:bold;
  }
  .note-tags {
    font-size:0.75rem;
    color:#8a7a68;
    display:flex;
    flex-wrap:wrap;
    gap:0.2rem;
  }
  .note-tag-pill {
    padding:0.05rem 0.4rem;
    border-radius:999px;
    border:1px solid #c9b89a;
  }
  .note-snippet {
    margin-top:0.3rem;
    font-size:0.8rem;
    color:#8a7a68;
    max-height:2.4em;
    overflow:hidden;
  }
  .note-actions {
    margin-top:0.3rem;
    display:flex;
    gap:0.3rem;
    flex-wrap:wrap;
  }
  .note-actions button {
    padding:0.2rem 0.6rem;
    font-size:0.75rem;
  }

  body.dark { background:#111; color:#f5f0e6; }
  body.dark .panel { background:#1b1815; border-color:#bda57a; }
  body.dark header p,
  body.dark .field-label,
  body.dark .hint,
  body.dark .note-group-title { color:#c0b09c; }
  body.dark input[type="text"],
  body.dark textarea,
  body.dark #preview {
    background:#1b1815;
    border-color:#bda57a;
    color:#f5f0e6;
  }
  body.dark .note-card {
    background:#1b1815;
    border-color:#bda57a;
  }
  body.dark .note-tag-pill { border-color:#bda57a; color:#f5f0e6; }
  body.dark .btn-ghost {
    border-color:#bda57a;
    color:#f5f0e6;
  }
  body.dark .btn-primary {
    background:#b88a4a;
    color:#111;
  }
  body.dark .theme-toggle {
    background:#1b1815;
    color:#f5f0e6;
    border-color:#bda57a;
  }
</style>
</head>
<body>
<div class="shell">
  <header>
    <h1>极 简 手 记</h1>
    <p>宣纸一页，记下当下心绪与思考。</p>
    <div class="top-bar">
      <input id="searchInput" placeholder="搜索标题或内容…" />
      <div class="tag-filter" id="tagFilter"></div>
      <button class="theme-toggle" id="themeToggle">切换主题</button>
    </div>
  </header>

  <main>
    <section class="panel">
      <h2>新 记</h2>
      <div class="field-label">标题</div>
      <input id="title" placeholder="如：长野的夜与一杯热茶" />
      <div class="field-label">标签（逗号分隔）</div>
      <input id="tags" placeholder="如：生活, 想法, 阅读" />
      <div class="hint">示例：工作, 想法, 日记, 技术, 读书笔记</div>
      <div class="field-label">正文</div>
      <div class="editor-row">
        <textarea id="content" placeholder="写点什么吧……"></textarea>
        <div id="preview"></div>
      </div>
      <div class="btn-row">
        <button class="btn-primary" id="saveBtn">保存</button>
        <button class="btn-ghost" id="clearDraftBtn">清除草稿</button>
        <span class="autosave-status" id="autosaveStatus">草稿自动保存中…</span>
      </div>
    </section>

    <section class="panel">
      <h2>手 记 一 览</h2>
      <div class="note-group-title">未归档</div>
      <div id="notes"></div>
      <div class="note-group-title">已归档</div>
      <div id="archived"></div>
    </section>
  </main>
</div>

<script>
  const API = location.origin;
  const titleInput = document.getElementById("title");
  const tagsInput = document.getElementById("tags");
  const contentInput = document.getElementById("content");
  const previewDiv = document.getElementById("preview");
  const autosaveStatus = document.getElementById("autosaveStatus");
  const saveBtn = document.getElementById("saveBtn");
  const clearDraftBtn = document.getElementById("clearDraftBtn");
  const searchInput = document.getElementById("searchInput");
  const tagFilterDiv = document.getElementById("tagFilter");
  const themeToggle = document.getElementById("themeToggle");
  const notesDiv = document.getElementById("notes");
  const archivedDiv = document.getElementById("archived");

  let allNotes = [];
  let activeTag = null;
  let autosaveTimer = null;

  function renderPreview() {
    const raw = contentInput.value || "";
    previewDiv.innerHTML = raw
      .split(/\\n\\n+/)
      .map(p => "<p>" + p.replace(/\\n/g,"<br>") + "</p>")
      .join("");
  }

  function scheduleAutosave() {
    autosaveStatus.textContent = "草稿自动保存中…";
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const draft = {
        title: titleInput.value || "",
        tags: tagsInput.value || "",
        content: contentInput.value || ""
      };
      localStorage.setItem("noteDraft", JSON.stringify(draft));
      autosaveStatus.textContent = "草稿已保存";
    }, 600);
  }

  function loadDraft() {
    const raw = localStorage.getItem("noteDraft");
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      titleInput.value = d.title || "";
      tagsInput.value = d.tags || "";
      contentInput.value = d.content || "";
      renderPreview();
      autosaveStatus.textContent = "已加载草稿";
    } catch {}
  }

  clearDraftBtn.onclick = () => {
    localStorage.removeItem("noteDraft");
    titleInput.value = "";
    tagsInput.value = "";
    contentInput.value = "";
    previewDiv.innerHTML = "";
    autosaveStatus.textContent = "草稿已清除";
  };

  contentInput.addEventListener("input", () => {
    renderPreview();
    scheduleAutosave();
  });
  titleInput.addEventListener("input", scheduleAutosave);
  tagsInput.addEventListener("input", scheduleAutosave);

  async function addNote() {
    const title = titleInput.value.trim() || "无标题";
    const content = contentInput.value.trim();
    const tagsRaw = tagsInput.value.trim();
    const tags = tagsRaw
      ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean)
      : [];
    const res = await fetch(API + "/note", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ title, content, tags, archived:false })
    });
    const data = await res.json();
    localStorage.removeItem("noteDraft");
    titleInput.value = "";
    tagsInput.value = "";
    contentInput.value = "";
    previewDiv.innerHTML = "";
    autosaveStatus.textContent = "已保存并清除草稿";
    await loadNotes();
    alert("已保存，ID: " + data.id);
  }

  saveBtn.onclick = addNote;

  async function loadNotes() {
    const res = await fetch(API + "/notes");
    const list = await res.json();
    allNotes = [];
    for (const item of list) {
      const r = await fetch(API + "/note/" + item.name);
      if (r.status !== 200) continue;
      const n = await r.json();
      allNotes.push({ id:item.name, ...n });
    }
    renderTagFilter();
    renderNoteLists();
  }

  function renderTagFilter() {
    const set = new Set();
    allNotes.forEach(n => (n.tags || []).forEach(t => set.add(t)));
    tagFilterDiv.innerHTML = "";
    if (!set.size) {
      tagFilterDiv.textContent = "暂无标签";
      return;
    }
    const allBtn = document.createElement("span");
    allBtn.className = "tag-pill" + (activeTag === null ? " active" : "");
    allBtn.textContent = "全部";
    allBtn.onclick = () => { activeTag = null; renderTagFilter(); renderNoteLists(); };
    tagFilterDiv.appendChild(allBtn);
    set.forEach(tag => {
      const el = document.createElement("span");
      el.className = "tag-pill" + (activeTag === tag ? " active" : "");
      el.textContent = tag;
      el.onclick = () => {
        activeTag = (activeTag === tag ? null : tag);
        renderTagFilter();
        renderNoteLists();
      };
      tagFilterDiv.appendChild(el);
    });
  }

  function matchSearch(note, q) {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (note.title || "").toLowerCase().includes(s) ||
      (note.content || "").toLowerCase().includes(s)
    );
  }

  function matchTag(note) {
    if (!activeTag) return true;
    return (note.tags || []).includes(activeTag);
  }

  function renderNoteLists() {
    const q = searchInput.value.trim();
    notesDiv.innerHTML = "";
    archivedDiv.innerHTML = "";
    allNotes
      .filter(n => matchSearch(n, q) && matchTag(n))
      .forEach(n => {
        const card = document.createElement("div");
        card.className = "note-card";
        const header = document.createElement("div");
        header.className = "note-header";
        const title = document.createElement("div");
        title.className = "note-title";
        title.textContent = n.title || "无标题";
        const tags = document.createElement("div");
        tags.className = "note-tags";
        (n.tags || []).forEach(t => {
          const span = document.createElement("span");
          span.className = "note-tag-pill";
          span.textContent = t;
          tags.appendChild(span);
        });
        header.appendChild(title);
        header.appendChild(tags);
        const snippet = document.createElement("div");
        snippet.className = "note-snippet";
        snippet.textContent = (n.content || "").replace(/\\s+/g," ").slice(0,80);
        const actions = document.createElement("div");
        actions.className = "note-actions";
        const viewBtn = document.createElement("button");
        viewBtn.className = "btn-ghost";
        viewBtn.textContent = "查看";
        viewBtn.onclick = () => { location.href = "/?id=" + n.id; };
        const delBtn = document.createElement("button");
        delBtn.className = "btn-ghost";
        delBtn.textContent = "删除";
        delBtn.onclick = async () => {
          if (!confirm("确认删除？")) return;
          await fetch(API + "/note/" + n.id, { method:"DELETE" });
          await loadNotes();
        };
        const archBtn = document.createElement("button");
        archBtn.className = "btn-ghost";
        archBtn.textContent = n.archived ? "取消归档" : "归档";
        archBtn.onclick = async () => {
          await fetch(API + "/note/" + n.id + "/archive", { method:"PUT" });
          await loadNotes();
        };
        actions.appendChild(viewBtn);
        actions.appendChild(archBtn);
        actions.appendChild(delBtn);
        card.appendChild(header);
        card.appendChild(snippet);
        card.appendChild(actions);
        (n.archived ? archivedDiv : notesDiv).appendChild(card);
      });
  }

  searchInput.addEventListener("input", renderNoteLists);

  const theme = localStorage.getItem("theme") || "light";
  if (theme === "dark") document.body.classList.add("dark");
  themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  };

  loadDraft();
  renderPreview();
  loadNotes();
</script>
</body>
</html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // ====== API：创建笔记 ======
    if (pathname === "/note" && request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();
      const note = {
        title: body.title || "",
        content: body.content || "",
        tags: Array.isArray(body.tags) ? body.tags : [],
        archived: !!body.archived,
        createdAt: Date.now()
      };
      await env.NOTES.put(id, JSON.stringify(note));
      return json({ id });
    }

    // ====== API：获取单条 ======
    if (pathname.startsWith("/note/") && request.method === "GET") {
      const id = pathname.split("/")[2];
      const note = await env.NOTES.get(id);
      if (!note) return new Response("Not Found", { status: 404 });
      return json(JSON.parse(note));
    }

    // ====== API：删除 ======
    if (pathname.startsWith("/note/") && request.method === "DELETE") {
      const id = pathname.split("/")[2];
      await env.NOTES.delete(id);
      return json({ ok: true });
    }

    // ====== API：归档/取消归档 ======
    if (pathname.startsWith("/note/") && pathname.endsWith("/archive") && request.method === "PUT") {
      const id = pathname.split("/")[2];
      const note = await env.NOTES.get(id);
      if (!note) return new Response("Not Found", { status: 404 });
      const data = JSON.parse(note);
      data.archived = !data.archived;
      await env.NOTES.put(id, JSON.stringify(data));
      return json({ archived: data.archived });
    }

    // ====== API：列表（只返回 key） ======
    if (pathname === "/notes" && request.method === "GET") {
      const list = await env.NOTES.list();
      return json(list.keys);
    }

    return new Response("Not Found", { status: 404 });
  }
};

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}
