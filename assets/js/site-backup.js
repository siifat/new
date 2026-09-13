/* =========================================================
   site.js — rendering, theme, and the hidden admin panel.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

  const attr = (v) => esc(v).replace(/"/g, "&quot;");
  const isHttp = (u) => /^https?:\/\//i.test(String(u || ""));
  const ext = (u) => (isHttp(u) ? ' target="_blank" rel="noopener"' : "");

  /* ---------- working copy of the data ---------- */
  let data = (typeof SITE_DATA !== "undefined") ? SITE_DATA : null;
  if (!data) {
    document.addEventListener("DOMContentLoaded", () => {
      const main = $("#main");
      if (main) main.innerHTML = '<div class="empty">Could not load <code>assets/js/site-data.js</code>.</div>';
    });
    return;
  }

  /* ---------- minimal markdown for blog bodies ---------- */
  function md(src) {
    const inline = (s) =>
      esc(s)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => '<a href="' + attr(u) + '"' + ext(u) + ">" + t + "</a>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|\s)\*([^*\n]+)\*/g, "$1<em>$2</em>");

    return String(src || "")
      .trim()
      .split(/\n{2,}/)
      .map((block) => {
        const lines = block.split("\n");
        if (/^###\s+/.test(lines[0])) return "<h3>" + inline(lines[0].replace(/^###\s+/, "")) + "</h3>";
        if (/^##\s+/.test(lines[0]))  return "<h2>" + inline(lines[0].replace(/^##\s+/, "")) + "</h2>";
        if (lines.every((l) => /^[-*]\s+/.test(l))) {
          return "<ul>" + lines.map((l) => "<li>" + inline(l.replace(/^[-*]\s+/, "")) + "</li>").join("") + "</ul>";
        }
        return "<p>" + lines.map(inline).join("<br>") + "</p>";
      })
      .join("");
  }

  /* ---------- shared fragments ---------- */
  function tagsHtml(tags, plain) {
    if (!tags || !tags.length) return "";
    return '<div class="item-tags">' +
      tags.map((t) => '<span class="tag' + (plain ? " tag-plain" : "") + '">' + esc(t) + "</span>").join("") +
      "</div>";
  }

  function pageHead(kicker, title, intro) {
    return '<header class="page-head">' +
      (kicker ? '<p class="kicker">' + esc(kicker) + "</p>" : "") +
      "<h1>" + esc(title) + "</h1>" +
      (intro ? "<p>" + esc(intro) + "</p>" : "") +
      "</header>";
  }

  function groupHtml(group) {
    const items = (group.items || []).map((it) => {
      const inner =
        '<div>' +
          '<a class="item-name" href="' + attr(it.href || "#") + '"' + ext(it.href) + ">" + esc(it.name) + "</a>" +
          (it.desc ? '<p class="item-desc">' + esc(it.desc) + "</p>" : "") +
          tagsHtml(it.tags) +
        "</div>" +
        (it.meta ? '<div class="item-meta">' + esc(it.meta) + "</div>" : "<div></div>");

      return '<div class="item">' + inner + "</div>";
    }).join("");

    return '<section class="group">' +
      '<div class="group-head">' +
        "<h2>" + esc(group.title) + "</h2>" +
        (group.note ? "<p>" + esc(group.note) + "</p>" : "") +
      "</div>" +
      items +
      "</section>";
  }

  /* ---------- page renderers ---------- */
  function renderHome() {
    const h = data.home || {};
    const facts = (h.facts || []).map((f) =>
      '<li><span class="k">' + esc(f.k) + '</span><span class="v">' + esc(f.v) + "</span></li>"
    ).join("");

    const actions = (h.actions || []).map((a) =>
      '<a class="btn' + (a.primary ? " btn-primary" : "") + '" href="' + attr(a.href) + '">' + esc(a.label) + "</a>"
    ).join("");

    const focus = (h.focus || []).map((f) =>
      '<article class="card focus-card"><h3>' + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></article>"
    ).join("");

    const now = (h.now || []).map((n) => "<li>" + esc(n) + "</li>").join("");

    const latest = ((data.blogs && data.blogs.posts) || []).slice(0, 3);

    return (
      '<section class="hero">' +
        "<div>" +
          (h.kicker ? '<p class="kicker">' + esc(h.kicker) + "</p>" : "") +
          "<h1>" + esc(h.headline || data.site.name) + "</h1>" +
          '<p class="hero-lede">' + (h.lede || "") + "</p>" +
          '<div class="hero-actions">' + actions + "</div>" +
        "</div>" +
        '<aside class="card">' +
          '<p class="kicker">Quick facts</p>' +
          '<ul class="fact-list">' + facts + "</ul>" +
        "</aside>" +
      "</section>" +

      '<section class="section">' +
        '<div class="section-head"><h2>What I work on</h2></div>' +
        '<div class="grid-3">' + focus + "</div>" +
      "</section>" +

      '<section class="section">' +
        '<div class="section-head"><h2>Latest writing</h2>' +
          '<a class="hint" href="blogs.html">All posts →</a></div>' +
        postListHtml(latest) +
      "</section>" +

      '<section class="section">' +
        '<div class="section-head"><h2>Right now</h2></div>' +
        '<ul class="now-list">' + now + "</ul>" +
      "</section>"
    );
  }

  function renderResources() {
    const r = data.resources || {};
    return pageHead("UIU Resources", "UIU Resources", r.intro) +
      (r.groups || []).map(groupHtml).join("");
  }

  function postListHtml(posts) {
    if (!posts.length) return '<div class="empty">No posts yet.</div>';
    return '<div class="post-list">' + posts.map((p) =>
      '<a class="post-row" href="blogs.html?post=' + encodeURIComponent(p.slug) + '">' +
        '<p class="post-date">' + esc(p.date) + "</p>" +
        '<p class="post-title">' + esc(p.title) + "</p>" +
        '<p class="post-excerpt">' + esc(p.excerpt) + "</p>" +
        tagsHtml(p.tags, true) +
      "</a>"
    ).join("") + "</div>";
  }

  function renderBlogPost(post) {
    if (!post) {
      return pageHead("Blogs", "Post not found", "That link does not point at anything on this site.") +
        '<a class="back-link" href="blogs.html">← All posts</a>';
    }
    return (
      '<a class="back-link" href="blogs.html">← All posts</a>' +
      '<article class="post-body">' +
        '<p class="kicker">' + esc(post.date) + "</p>" +
        "<h1>" + esc(post.title) + "</h1>" +
        tagsHtml(post.tags) +
        '<div style="height:20px"></div>' +
        md(post.body || post.excerpt) +
      "</article>"
    );
  }

  function renderBlogs() {
    const b = data.blogs || {};
    const params = new URLSearchParams(location.search);
    const slug = params.get("post");

    if (slug) {
      const post = (b.posts || []).find((p) => p.slug === slug);
      document.title = (post ? post.title + " — " : "") + data.site.name;
      return renderBlogPost(post);
    }

    return pageHead("Blogs", "Blogs", b.intro) + postListHtml(b.posts || []);
  }

  function renderHelp() {
    const hp = data.help || {};

    const faqs = (hp.faqs || []).map((f) =>
      "<details><summary>" + esc(f.q) + '</summary><div class="faq-body">' + (f.a || "") + "</div></details>"
    ).join("");

    const contacts = (hp.contacts || []).map((c) =>
      '<div class="item"><div>' +
        '<a class="item-name" href="' + attr(c.href || "#") + '"' + ext(c.href) + ">" + esc(c.label) + "</a>" +
        '<p class="item-desc">' + esc(c.value) + "</p>" +
      "</div><div></div></div>"
    ).join("");

    return pageHead("Help", "Help & contact", hp.intro) +
      '<section class="section">' +
        '<div class="section-head"><h2>Frequently asked</h2></div>' +
        '<div class="faq">' + faqs + "</div>" +
      "</section>" +
      '<section class="section">' +
        '<div class="section-head"><h2>Reach me</h2></div>' +
        '<div class="group">' + contacts + "</div>" +
      "</section>";
  }

  /* ---------- chrome: brand, footer, socials ---------- */
  function renderChrome() {
    const s = data.site || {};
    $$("[data-bind='siteName']").forEach((el) => { el.textContent = s.name || ""; });
    $$("[data-bind='initials']").forEach((el) => { el.textContent = s.initials || ""; });
    $$("[data-bind='footerNote']").forEach((el) => { el.textContent = s.footerNote || ""; });

    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();

    const nav = $("#socialLinks");
    if (nav) {
      nav.innerHTML = (s.socials || []).map((l) =>
        '<a href="' + attr(l.url) + '"' + ext(l.url) + ">" + esc(l.label) + "</a>"
      ).join("");
    }

    if (!location.search) {
      document.title = (s.name || "Home") + (document.body.dataset.page === "home" ? " — Home" : "");
    }
  }

  /* ---------- dispatch ---------- */
  function render() {
    renderChrome();

    const main = $("#main");
    if (!main) return;

    const page = document.body.dataset.page || "home";
    if (page === "resources")      main.innerHTML = renderResources();
    else if (page === "blogs")     main.innerHTML = renderBlogs();
    else if (page === "help")      main.innerHTML = renderHelp();
    else                           main.innerHTML = renderHome();
  }

  /* ---------- theme ---------- */
  function initTheme() {
    const btn = $("#themeBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const dark = document.documentElement.classList.toggle("dark");
      try { localStorage.setItem("site-theme", dark ? "dark" : "light"); } catch (e) {}
    });
  }

  /* =========================================================
     ADMIN PANEL
     Open with Ctrl/Cmd + Shift + A, or by adding #admin to the URL.
     Edit, apply, then download site-data.js and overwrite the
     local file. Push to GitHub Pages when you are happy.
     ========================================================= */
  const ADMIN_FIELDS = [
    ["site.name",       "Site name (header + footer)"],
    ["site.initials",   "Initials shown in the logo square"],
    ["site.footerNote", "Footer note"],
    ["home.kicker",     "Home — small line above the headline"],
    ["home.headline",   "Home — headline"],
    ["home.lede",       "Home — intro paragraph (HTML allowed)"]
  ];

  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    let cur = obj;
    keys.forEach((k) => { if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {}; cur = cur[k]; });
    cur[last] = value;
  }

  let overlay = null;

  function openAdmin() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "admin-overlay";
    overlay.innerHTML =
      '<div class="admin-panel" role="dialog" aria-modal="true" aria-label="Site admin">' +
        '<div class="admin-head">' +
          '<h2>Site admin</h2>' +
          '<span class="spacer"></span>' +
          '<button class="btn" id="adminClose" type="button">Close</button>' +
        "</div>" +
        '<div class="admin-tabs" role="tablist">' +
          '<button class="admin-tab" role="tab" data-tab="fields" aria-selected="true">Quick fields</button>' +
          '<button class="admin-tab" role="tab" data-tab="json" aria-selected="false">Full JSON</button>' +
        "</div>" +
        '<div class="admin-body">' +
          '<div id="adminPaneFields">' +
            '<p class="admin-hint">Every other part of the site — resource groups, blog posts, FAQs — is edited in the Full JSON tab.</p>' +
            ADMIN_FIELDS.map(([path, label]) =>
              '<div class="admin-field"><label for="f_' + path + '">' + esc(label) + "</label>" +
              '<input id="f_' + path + '" data-path="' + attr(path) + '" type="text" /></div>'
            ).join("") +
          "</div>" +
          '<div id="adminPaneJson" hidden>' +
            '<p class="admin-hint">This is the exact contents of <code>assets/js/site-data.js</code>. Keys must keep their double quotes. Array order is the order shown on the site.</p>' +
            "<textarea id=" + '"adminJson"' + ' spellcheck="false" aria-label="Site data JSON"></textarea>' +
          "</div>" +
        "</div>" +
        '<div class="admin-foot">' +
          '<button class="btn btn-primary" id="adminApply" type="button">Apply to page</button>' +
          '<button class="btn" id="adminDownload" type="button">Download site-data.js</button>' +
          '<button class="btn" id="adminReload" type="button">Reload saved</button>' +
          '<span class="admin-status" id="adminStatus">Editing in memory only.</span>' +
        "</div>" +
      "</div>";

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const jsonArea = $("#adminJson", overlay);
    const status = $("#adminStatus", overlay);

    function fillFields() {
      $$("input[data-path]", overlay).forEach((inp) => {
        inp.value = getPath(data, inp.dataset.path) || "";
      });
    }
    function fillJson() {
      jsonArea.value = JSON.stringify(data, null, 2);
    }

    function setStatus(msg, kind) {
      status.textContent = msg;
      status.className = "admin-status" + (kind ? " " + kind : "");
    }

    fillFields();
    fillJson();

    /* tabs */
    $$(".admin-tab", overlay).forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".admin-tab", overlay).forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
        const isJson = tab.dataset.tab === "json";
        $("#adminPaneJson", overlay).hidden = !isJson;
        $("#adminPaneFields", overlay).hidden = isJson;
      });
    });

    /* quick fields → JSON preview stays in sync */
    $$("input[data-path]", overlay).forEach((inp) => {
      inp.addEventListener("input", () => {
        setPath(data, inp.dataset.path, inp.value);
        fillJson();
        setStatus("Unsaved changes.", "");
      });
    });

    jsonArea.addEventListener("input", () => setStatus("Unsaved changes.", ""));

    /* apply */
    $("#adminApply", overlay).addEventListener("click", () => {
      const raw = jsonArea.value;
      if (raw.trim()) {
        try {
          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== "object") throw new Error("Root must be an object");
          data = parsed;
        } catch (err) {
          setStatus("JSON error: " + err.message, "err");
          return;
        }
      }
      fillFields();
      fillJson();
      render();
      setStatus("Applied. Download to keep it.", "ok");
    });

    /* download */
    $("#adminDownload", overlay).addEventListener("click", () => {
      let payload;
      try {
        payload = JSON.parse(jsonArea.value);
      } catch (err) {
        setStatus("Fix the JSON before downloading.", "err");
        return;
      }
      data = payload;

      const header =
        "/* =========================================================\n" +
        "   site-data.js  —  ALL site content lives here.\n" +
        "   Generated by the admin panel on " + new Date().toISOString().slice(0, 10) + ".\n" +
        "   ========================================================= */\n\n";
      const body = "const SITE_DATA = " + JSON.stringify(data, null, 2) + ";\n";

      const blob = new Blob([header + body], { type: "text/javascript;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "site-data.js";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      render();
      setStatus("Downloaded. Replace assets/js/site-data.js with it.", "ok");
    });

    /* reload from the original file */
    $("#adminReload", overlay).addEventListener("click", () => {
      if (typeof SITE_DATA !== "undefined") data = SITE_DATA;
      fillFields();
      fillJson();
      render();
      setStatus("Reloaded from site-data.js.", "ok");
    });

    /* close */
    function close() {
      overlay.remove();
      overlay = null;
      document.body.style.overflow = "";
    }
    $("#adminClose", overlay).addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- boot ---------- */
  function boot() {
    render();
    initTheme();

    document.addEventListener("keydown", (e) => {
      const combo = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a");
      if (combo) { e.preventDefault(); openAdmin(); }
    });

    if (location.hash === "#admin") openAdmin();
    window.addEventListener("hashchange", () => {
      if (location.hash === "#admin") openAdmin();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();