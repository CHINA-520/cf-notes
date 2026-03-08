export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const cookie = request.headers.get("Cookie") || "";
    const isAuthed = cookie.includes(`auth=${env.ADMIN_PASSWORD}`);

    if (pathname === "/login" && request.method === "POST") {
      const { password } = await request.json();
      if (password === env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: {
            "Set-Cookie": `auth=${password}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Strict`,
            "Content-Type": "application/json"
          }
        });
      }
      return new Response(JSON.stringify({ ok: false }), { status: 401 });
    }

    if (pathname === "/logout") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          "Set-Cookie": `auth=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict`,
          "Content-Type": "application/json"
        }
      });
    }

    const isPublicPage = pathname === "/" && searchParams.get("id");
    if (!isAuthed && !isPublicPage) {
      return new Response(renderLoginPage(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (pathname === "/" && searchParams.get("id")) {
      const id = searchParams.get("id");
      const note = await env.NOTES.get(id);
      if (!note) return new Response("Not Found", { status: 404 });
      const data = JSON.parse(note);
      return new Response(renderDetailPage(data), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (pathname === "/" && request.method === "GET") {
      return new Response(renderIndexPage(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (!isAuthed) return new Response("Unauthorized", { status: 401 });

    if (pathname === "/note" && request.method === "POST") {
      const body = await request.json();
      const id = Math.random().toString(36).slice(2, 10); 
      const note = {
        title: body.title || "无标题",
        content: body.content || "",
        tags: Array.isArray(body.tags) ? body.tags : [],
        createdAt: Date.now()
      };
      await env.NOTES.put(id, JSON.stringify(note));
      return json({ id });
    }

    if (pathname.startsWith("/note/") && request.method === "GET") {
      const id = pathname.split("/")[2];
      const note = await env.NOTES.get(id);
      if (!note) return new Response("Not Found", { status: 404 });
      return json(JSON.parse(note));
    }

    if (pathname.startsWith("/note/") && request.method === "DELETE") {
      const id = pathname.split("/")[2];
      await env.NOTES.delete(id);
      return json({ ok: true });
    }

    if (pathname === "/notes" && request.method === "GET") {
      const list = await env.NOTES.list();
      return json(list.keys);
    }

    return new Response("Not Found", { status: 404 });
  }
};

function json(obj) { return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json; charset=utf-8" } }); }
function escapeHtml(str) { return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

function renderLoginPage() {
  return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>身份验证</title><style>body{background:#f9f5ed;font-family:"Noto Serif SC","SimSun",serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.login-card{background:#fffdf9;padding:2.5rem;border-radius:12px;border:1px solid #e3d7bf;box-shadow:0 8px 30px rgba(165,145,115,0.1);text-align:center}input{padding:0.6rem 1rem;border:1px solid #dcd1b9;border-radius:999px;margin-bottom:1.2rem;width:220px;outline:none;background:#fffdf7;text-align:center}button{padding:0.6rem 2.5rem;background:#8b6d4d;color:#fffdf7;border:none;border-radius:999px;cursor:pointer}</style></head><body><div class="login-card"><h2>极简手记</h2><input type="password" id="pw" placeholder="请输入通行口令"/><br><button onclick="login()">开启</button></div><script>async function login(){const res=await fetch('/login',{method:'POST',body:JSON.stringify({password:document.getElementById('pw').value})});if(res.ok)location.reload();else alert('口令有误')}</script></body></html>`;
}

function renderDetailPage(data) {
  const title = escapeHtml(data.title || "无标题");
  return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title><style>:root{color-scheme:light dark}body{margin:0;padding:1.5rem;font-family:"Noto Serif SC","SimSun",serif;background:#f9f5ed;color:#2b2118;line-height:1.8}.page{max-width:800px;margin:2rem auto;background:#fffdf9;border:1px solid #e3d7bf;border-radius:12px;padding:2.5rem;box-shadow:0 8px 30px rgba(165,145,115,0.08)}.title{text-align:center;font-size:1.8rem;letter-spacing:0.2em;margin-bottom:0.5rem}.meta{text-align:center;font-size:0.9rem;color:#8a7a68;margin-bottom:1.5rem}.tag{display:inline-block;padding:0.15rem 0.6rem;border-radius:999px;border:1px solid #dcd1b9;background:#efe8d9;margin:0 0.2rem;font-size:0.8rem;color:#6b5a45}hr{border:0;border-top:1px solid #e3d7bf;margin:2rem 0}.content p{text-indent:2em;margin:1.2rem 0}.back{display:inline-block;margin-bottom:1.5rem;font-size:0.9rem;color:#8b6d4d;text-decoration:none}body.dark{background:#161614;color:#d1c7b7}body.dark .page{background:#1f1f1d;border-color:#3d3a35}body.dark hr{border-color:#3d3a35}</style></head><body><div class="page"><a href="/" class="back">← 返回首页</a><div class="title">${title}</div><div class="meta">${(data.tags||[]).map(t=>'<span class="tag">'+escapeHtml(t)+'</span>').join("")}</div><hr><div class="content" id="content"></div></div><script>const raw=${JSON.stringify(data.content || "")};document.getElementById("content").innerHTML=raw.split(/\\n\\n+/).map(p=>"<p>"+p.replace(/\\n/g,"<br>")+"</p>").join("");</script></body></html>`;
}

function renderIndexPage() {
  return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>极简手记 · 宣纸</title><style>:root{color-scheme:light dark}body{margin:0;font-family:"Noto Serif SC","SimSun",serif;background:#f9f5ed;color:#2b2118;line-height:1.6}.shell{max-width:1100px;margin:0 auto;padding:2rem 1.5rem}header{text-align:center;margin-bottom:2.5rem}header h1{margin:0;font-size:2.4rem;letter-spacing:0.4em;font-weight:normal}.top-bar{margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;align-items:center}.top-bar input{width:300px;padding:0.5rem 1.2rem;border-radius:999px;border:1px solid #e3d7bf;background:#fffdf9;font-family:inherit;outline:none}.controls{display:flex;gap:0.6rem}.theme-toggle,.logout-btn{padding:0.4rem 1.2rem;border-radius:999px;border:1px solid #e3d7bf;background:#fffdf9;font-size:0.85rem;cursor:pointer}main{margin-top:2rem;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:2rem}.panel{background:#fffdf9;border-radius:12px;border:1px solid #e3d7bf;padding:1.5rem;box-shadow:0 8px 30px rgba(165,145,115,0.06)}.panel h2{margin:0 0 1.2rem;font-size:1.2rem;letter-spacing:0.2em;border-bottom:1px solid #f0e9d9;padding-bottom:0.6rem}input,textarea{width:100%;box-sizing:border-box;padding:0.7rem;border-radius:8px;border:1px solid #dcd1b9;background:#fffdfc;font-family:inherit;font-size:0.95rem;outline:none}textarea{height:250px;resize:vertical}#preview{border-radius:8px;border:1px solid #dcd1b9;padding:0.7rem;background:#fffdfc;font-size:0.95rem;overflow:auto;height:250px;color:#444}#preview p{margin:0.5rem 0;text-indent:2em}.btn-row{margin-top:1.2rem;display:flex;gap:1rem;align-items:center}.note-card{border-radius:10px;border:1px solid #e3d7bf;padding:1.2rem;margin-bottom:1rem;background:#fffdfc}.note-header{display:flex;justify-content:space-between;margin-bottom:0.6rem}.note-title{font-size:1.1rem;font-weight:500;color:#2b2118;}.action-btn{border:1px solid #dcd1b9;background:none;border-radius:999px;padding:0.2rem 0.8rem;cursor:pointer;font-size:0.8rem;color:#8b6d4d}body.dark{background:#161614;color:#d1c7b7}body.dark .panel,body.dark .note-card{background:#1f1f1d;border-color:#3d3a35}body.dark input,body.dark textarea,body.dark #preview{background:#262624;border-color:#4a463e;color:#d1c7b7}</style></head><body><div class="shell"><header><h1>极 简 手 记</h1><div class="top-bar"><input id="searchInput" placeholder="搜索手记内容..."/><div class="controls"><button class="theme-toggle" id="themeToggle">主题</button><button class="logout-btn" id="logoutBtn">退出</button></div></div></header><main><section class="panel"><h2>新 记</h2><input id="title" placeholder="标题..."/><div style="margin:1rem 0 0.4rem;font-size:0.85rem;color:#8a7a68">标签</div><input id="tags" placeholder="生活, 随笔"/><div style="margin:1rem 0 0.4rem;font-size:0.85rem;color:#8a7a68">正文</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem"><textarea id="content" placeholder="此刻在想什么..."></textarea><div id="preview"></div></div><div class="btn-row"><button id="saveBtn" style="background:#8b6d4d;color:#fffdf7;padding:0.6rem 2rem;border-radius:999px;border:none;cursor:pointer">保存</button><span id="wordCount" style="font-size:0.85rem;color:#8a7a68;margin-left:auto">0 字</span></div></section><section class="panel"><h2>手 记 一 览</h2><div id="notes"></div></section></main></div><script>
  const titleInput=document.getElementById("title"),tagsInput=document.getElementById("tags"),contentInput=document.getElementById("content"),previewDiv=document.getElementById("preview"),saveBtn=document.getElementById("saveBtn"),notesDiv=document.getElementById("notes"),wordCount=document.getElementById("wordCount");
  contentInput.oninput=()=>{
    previewDiv.innerHTML=(contentInput.value||"").split(/\\n\\n+/).map(p=>"<p>"+p.replace(/\\n/g,"<br>")+"</p>").join("");
    wordCount.textContent=contentInput.value.length+" 字";
  };
  async function loadNotes(){
    const res=await fetch(location.origin+"/notes");const list=await res.json();notesDiv.innerHTML="";
    let notesData = [];
    for(const item of list){
      const r=await fetch(location.origin+"/note/"+item.name);
      if(r.ok){ const n=await r.json(); notesData.push({ id: item.name, ...n }); }
    }
    notesData.sort((a,b)=>b.createdAt - a.createdAt);
    notesData.forEach(n=>{
      const card=document.createElement("div");card.className="note-card";
      card.innerHTML=\`<div class="note-header"><div class="note-title">\${n.title}</div></div><div style="font-size:0.95rem;color:#8a7a68;margin-bottom:1rem">\${n.content.slice(0,50)}...</div><div style="display:flex;gap:0.5rem"><button class="action-btn" onclick="location.href='/?id=\${n.id}'">查看</button><button class="action-btn" onclick="deleteNote('\${n.id}')">删除</button></div>\`;
      notesDiv.appendChild(card);
    });
  }
  async function deleteNote(id){
    if(confirm("确定删除这篇手记吗？")){ await fetch(location.origin+"/note/"+id,{method:"DELETE"}); loadNotes(); }
  }
  saveBtn.onclick=async()=>{
    await fetch(location.origin+"/note",{method:"POST",body:JSON.stringify({title:titleInput.value||"无标题",content:contentInput.value,tags:tagsInput.value.split(",")})});
    titleInput.value=contentInput.value=tagsInput.value="";
    previewDiv.innerHTML=""; wordCount.textContent="0 字";
    loadNotes();
  };
  document.getElementById("logoutBtn").onclick=async()=>{await fetch("/logout");location.reload()};
  document.getElementById("themeToggle").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light")};
  if(localStorage.getItem("theme")==="dark") document.body.classList.add("dark");
  loadNotes();
</script></body></html>`;
}
