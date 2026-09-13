/* =========================================================
   site.js — rendering, theme, and the advanced admin panel.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- helpers ---------------- */
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc  = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  const attr = (v) => esc(v);
  const isHttp = (u) => /^https?:\/\//i.test(String(u || ""));
  const extAttr = (u) => (isHttp(u) ? ' target="_blank" rel="noopener"' : "");
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------- markdown (blog bodies) ---------------- */
  function md(src) {
    const inline = (s) =>
      esc(s)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => '<a href="' + attr(u) + '"' + extAttr(u) + ">" + t + "</a>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|\s)\*([^*\n]+)\*/g, "$1<em>$2</em>");
    return String(src || "").trim().split(/\n{2,}/).map((block) => {
      const lines = block.split("\n");
      if (/^###\s+/.test(lines[0])) return "<h3>" + inline(lines[0].replace(/^###\s+/, "")) + "</h3>";
      if (/^##\s+/.test(lines[0]))  return "<h2>" + inline(lines[0].replace(/^##\s+/, "")) + "</h2>";
      if (lines.every((l) => /^[-*]\s+/.test(l)))
        return "<ul>" + lines.map((l) => "<li>" + inline(l.replace(/^[-*]\s+/, "")) + "</li>").join("") + "</ul>";
      return "<p>" + lines.map(inline).join("<br>") + "</p>";
    }).join("");
  }

  /* ---------------- state ---------------- */
  let data = (typeof SITE_DATA !== "undefined") ? SITE_DATA : null;
  const MAT = (typeof window.MATERIALS_INDEX !== "undefined") ? window.MATERIALS_INDEX : { courses: [] };

  if (!data) {
    document.addEventListener("DOMContentLoaded", () => {
      const m = $("#main"); if (m) m.innerHTML = '<div class="empty">Missing <code>assets/js/site-data.js</code>.</div>';
    });
    return;
  }

  /* ---------------- shared html ---------------- */
  const tagsHtml = (tags, plain) =>
    (tags && tags.length)
      ? '<div class="item-tags">' + tags.map((t) =>
          '<span class="tag' + (plain ? " tag-plain" : "") + '">' + esc(t) + "</span>").join("") + "</div>"
      : "";

  const pageHead = (kicker, title, intro) =>
    '<header class="page-head">' +
      (kicker ? '<p class="kicker">' + esc(kicker) + "</p>" : "") +
      "<h1>" + esc(title) + "</h1>" +
      (intro ? "<p>" + intro + "</p>" : "") +
    "</header>";
  
  const CHEV_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  /* ---------------- resources ---------------- */
  function manualGroupHtml(g, defaultOpen) {
    const items = (g.items || []).map((it) =>
      '<div class="item">' +
        '<div>' +
          '<a class="item-name" href="' + attr(it.href || "#") + '"' + extAttr(it.href) + ">" + esc(it.name) + "</a>" +
          (it.desc ? '<p class="item-desc">' + esc(it.desc) + "</p>" : "") +
          tagsHtml(it.tags) +
        "</div>" +
        (it.meta ? '<div class="item-meta">' + esc(it.meta) + "</div>" : "<div></div>") +
      "</div>"
    ).join("");

    const open = (typeof g.open === "boolean" ? g.open : defaultOpen) ? " open" : "";
    const count = (g.items || []).length;

    return (
      '<details class="group"' + open + ">" +
        '<summary class="group-head">' +
          '<span class="group-chev">▾</span>' +
          '<div class="group-title-wrap">' +
            "<h2>" + esc(g.title || "Untitled") + "</h2>" +
            (g.note ? "<p>" + esc(g.note) + "</p>" : "") +
          "</div>" +
          '<span class="group-count">' + count + (count === 1 ? " item" : " items") + "</span>" +
        "</summary>" +
        '<div class="group-body">' + items + "</div>" +
      "</details>"
    );
  }

  function courseGroupHtml(course, override, defaultOpen) {
  const ovr = override || {};
  const title = ovr.title || (course.code ? course.code + " — " + course.title : course.title);
  const desc  = ovr.description != null ? ovr.description : (course.description || "");
  const meta  = [course.semester, course.instructor].filter(Boolean).join(" · ");
  const totalFiles = (course.sections || []).reduce((n, s) => n + (s.files || []).length, 0);
  const open = (typeof ovr.open === "boolean" ? ovr.open : defaultOpen) ? " open" : "";

  const sections = (course.sections || []).map((s) => {
    const files = (s.files || []).map((f) =>
      '<div class="file-row">' +
        '<span class="file-icon">' + esc((f.ext || "").slice(0, 4) || "file") + "</span>" +
        '<span class="file-name"><a href="' + attr(f.href) + '"' + extAttr(f.href) + ">" + esc(f.name) + "</a></span>" +
        '<span class="file-size">' + esc(f.size || "") + "</span>" +
      "</div>"
    ).join("");

    return (
      '<details class="subgroup" open>' +
        '<summary class="subgroup-head">' +
          '<span class="chev">' + CHEV_SVG + "</span>" +
          '<div class="group-title-wrap"><h3>' + esc(s.name) + "</h3></div>" +
          '<span class="group-count">' + (s.files || []).length + "</span>" +
        "</summary>" +
        '<div class="subgroup-body">' + files + "</div>" +
      "</details>"
    );
  }).join("");

  return (
    '<details class="group course"' + open + ">" +
      '<summary class="group-head">' +
        '<span class="chev">' + CHEV_SVG + "</span>" +
        '<div class="group-title-wrap">' +
          "<h2>" + esc(title) + "</h2>" +
          (desc ? "<p>" + esc(desc) + "</p>" : "") +
          (meta ? '<p class="meta">' + esc(meta) + "</p>" : "") +
          tagsHtml(course.tags) +
        "</div>" +
        '<span class="group-count">' + totalFiles + (totalFiles === 1 ? " file" : " files") + "</span>" +
      "</summary>" +
      '<div class="group-body">' + sections + "</div>" +
    "</details>"
  );
}

  function renderResources() {
  const r = data.resources || {};
  const html = [pageHead("UIU Resources", "UIU Resources", r.intro || "")];

  let coursesRendered = 0;
  if (r.showAutoCourses !== false && MAT && MAT.courses && MAT.courses.length) {
    const overrides = r.courseOverrides || {};
    const defaultOpen = !!r.autoOpenCourses;
    const courses = MAT.courses.slice().sort((a, b) =>
      (a.order || 100) - (b.order || 100) || a.title.localeCompare(b.title)
    );
    for (const c of courses) {
      const ovr = overrides[c.slug] || {};
      if (ovr.hidden) continue;
      html.push(courseGroupHtml(c, ovr, defaultOpen));
      coursesRendered++;
    }
  }

  const manualGroups = r.groups || [];
  const showDivider = coursesRendered > 0 && manualGroups.length > 0;
  if (showDivider) {
    html.push(
      '<div class="resources-divider">' +
        '<span class="resources-divider-label">' +
          esc(r.manualGroupsLabel || "More resources") +
        "</span>" +
      "</div>"
    );
  }

  const defaultGroupOpen = r.autoOpenGroups !== false;
  for (const g of manualGroups) html.push(manualGroupHtml(g, defaultGroupOpen));

  if (html.length === 1) {
    html.push('<div class="empty">No materials yet. Add a folder under <code>materials/</code> and run <code>node tools/build-materials.js</code>.</div>');
  }
  return html.join("");
}

  /* ---------------- home / blogs / help ---------------- */
  function renderHome() {
    const h = data.home || {};
    const facts = (h.facts || []).map((f) =>
      '<li><span class="k">' + esc(f.k) + '</span><span class="v">' + esc(f.v) + "</span></li>").join("");
    const actions = (h.actions || []).map((a) =>
      '<a class="btn' + (a.primary ? " btn-primary" : "") + '" href="' + attr(a.href) + '">' + esc(a.label) + "</a>").join("");
    const focus = (h.focus || []).map((f) =>
      '<article class="card focus-card"><h3>' + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></article>").join("");
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
      '<section class="section"><div class="section-head"><h2>What I work on</h2></div>' +
        '<div class="grid-3">' + focus + "</div></section>" +
      '<section class="section"><div class="section-head"><h2>Latest writing</h2>' +
        '<a class="hint" href="blogs.html">All posts →</a></div>' + postListHtml(latest) + "</section>" +
      '<section class="section"><div class="section-head"><h2>Right now</h2></div>' +
        '<ul class="now-list">' + now + "</ul></section>"
    );
  }

  function postListHtml(posts) {
    if (!posts.length) return '<div class="empty">No posts yet.</div>';
    return '<div class="post-list">' + posts.map((p) =>
      '<a class="post-row" href="blogs.html?post=' + encodeURIComponent(p.slug) + '">' +
        '<p class="post-date">' + esc(p.date) + "</p>" +
        '<p class="post-title">' + esc(p.title) + "</p>" +
        '<p class="post-excerpt">' + esc(p.excerpt) + "</p>" +
        tagsHtml(p.tags, true) +
      "</a>").join("") + "</div>";
  }

  function renderBlogPost(post) {
    if (!post)
      return pageHead("Blogs", "Post not found", "That link does not point at anything on this site.") +
        '<a class="back-link" href="blogs.html">← All posts</a>';
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
    const slug = new URLSearchParams(location.search).get("post");
    if (slug) {
      const post = (b.posts || []).find((p) => p.slug === slug);
      document.title = (post ? post.title + " — " : "") + (data.site.name || "Blogs");
      return renderBlogPost(post);
    }
    return pageHead("Blogs", "Blogs", b.intro) + postListHtml(b.posts || []);
  }

  function renderHelp() {
    const hp = data.help || {};
    const faqs = (hp.faqs || []).map((f) =>
      "<details><summary>" + esc(f.q) + '</summary><div class="faq-body">' + (f.a || "") + "</div></details>").join("");
    const contacts = (hp.contacts || []).map((c) =>
      '<div class="item"><div>' +
        '<a class="item-name" href="' + attr(c.href || "#") + '"' + extAttr(c.href) + ">" + esc(c.label) + "</a>" +
        '<p class="item-desc">' + esc(c.value) + "</p></div><div></div></div>").join("");
    return pageHead("Help", "Help & contact", hp.intro) +
      '<section class="section"><div class="section-head"><h2>Frequently asked</h2></div>' +
        '<div class="faq">' + faqs + "</div></section>" +
      '<section class="section"><div class="section-head"><h2>Reach me</h2></div>' +
        '<div class="group-body" style="border:0;padding:0">' + contacts + "</div></section>";
  }

  /* ---------------- chrome + dispatch ---------------- */
  function renderChrome() {
    const s = data.site || {};
    $$("[data-bind='siteName']").forEach((el) => el.textContent = s.name || "");
    $$("[data-bind='initials']").forEach((el) => el.textContent = s.initials || "");
    $$("[data-bind='footerNote']").forEach((el) => el.textContent = s.footerNote || "");
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
    const nav = $("#socialLinks");
    if (nav) nav.innerHTML = (s.socials || []).map((l) =>
      '<a href="' + attr(l.url) + '"' + extAttr(l.url) + ">" + esc(l.label) + "</a>").join("");
  }

  function render() {
    renderChrome();
    const main = $("#main"); if (!main) return;
    const page = document.body.dataset.page || "home";
    if (page === "resources")      main.innerHTML = renderResources();
    else if (page === "blogs")     main.innerHTML = renderBlogs();
    else if (page === "help")      main.innerHTML = renderHelp();
    else                           main.innerHTML = renderHome();
  }

  function initTheme() {
    const btn = $("#themeBtn"); if (!btn) return;
    btn.addEventListener("click", () => {
      const dark = document.documentElement.classList.toggle("dark");
      try { localStorage.setItem("site-theme", dark ? "dark" : "light"); } catch (e) {}
    });
  }

  /* =========================================================
     ADMIN PANEL v2
     Ctrl/Cmd + Shift + A   or   add #admin to the URL
     ========================================================= */
  const TABS = [
    ["site",      "Site"],
    ["home",      "Home"],
    ["resources", "Resources"],
    ["blogs",     "Blogs"],
    ["help",      "Help"],
    ["materials", "Materials"],
    ["data",      "Raw JSON"]
  ];

  let overlay = null;
  let activeTab = "site";

  /* small DOM builders */
  function field(label, key, value, opts) {
    opts = opts || {};
    const cls = "admin-field" + (opts.wide ? " admin-field-wide" : "");
    if (opts.type === "textarea") {
      return '<div class="' + cls + '"><label>' + esc(label) + "</label>" +
        '<textarea data-key="' + attr(key) + '" rows="' + (opts.rows || 3) + '" spellcheck="false">' +
        esc(value || "") + "</textarea></div>";
    }
    if (opts.type === "tags") {
      return '<div class="' + cls + '"><label>' + esc(label) + ' <span style="opacity:.5">(comma separated)</span></label>' +
        '<input type="text" data-key="' + attr(key) + '" data-tags="1" value="' +
        attr((value || []).join(", ")) + '" placeholder="tag1, tag2"></div>';
    }
    return '<div class="' + cls + '"><label>' + esc(label) + "</label>" +
      '<input type="text" data-key="' + attr(key) + '" value="' + attr(value || "") + '"></div>';
  }

  function card(tag, bodyHtml) {
    return '<div class="admin-card">' +
      '<div class="admin-card-head">' +
        '<span class="admin-card-tag">' + esc(tag) + "</span>" +
        '<span class="spacer"></span>' +
        '<button class="btn-mini" data-act="up" type="button">↑</button>' +
        '<button class="btn-mini" data-act="down" type="button">↓</button>' +
        '<button class="btn-mini" data-act="dup" type="button">Duplicate</button>' +
        '<button class="btn-mini danger" data-act="del" type="button">Remove</button>' +
      "</div>" +
      bodyHtml +
    "</div>";
  }

  const addBtn = (label, act) =>
    '<button class="admin-add" data-act="' + act + '" type="button">+ ' + esc(label) + "</button>";

  function serializeCard(cardEl) {
    const obj = {};
    $$("[data-key]", cardEl).forEach((el) => {
      const key = el.dataset.key;
      obj[key] = el.dataset.tags
        ? el.value.split(",").map((s) => s.trim()).filter(Boolean)
        : el.value;
    });
    return obj;
  }

  /* wrappers that keep arrays/dicts in sync as the user types */
  function bindList(listEl, arr, renderFn) {
    function rebuild() {
      listEl.innerHTML = arr.map((item, i) => renderFn(item, i)).join("");
    }
    function commitCard(cardEl, i) {
      arr[i] = Object.assign({}, arr[i], serializeCard(cardEl));
    }
    listEl.addEventListener("input", (e) => {
      const cardEl = e.target.closest(".admin-card");
      if (!cardEl) return;
      const i = $$(".admin-card", listEl).indexOf(cardEl);
      commitCard(cardEl, i);
    });
    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]"); if (!btn) return;
      const cardEl = btn.closest(".admin-card"); if (!cardEl) return;
      const i = $$(".admin-card", listEl).indexOf(cardEl);
      const act = btn.dataset.act;
      commitCard(cardEl, i);
      if (act === "up" && i > 0)      { const t = arr[i-1]; arr[i-1] = arr[i]; arr[i] = t; }
      if (act === "down" && i < arr.length - 1) { const t = arr[i+1]; arr[i+1] = arr[i]; arr[i] = t; }
      if (act === "dup")              { arr.splice(i + 1, 0, clone(arr[i])); }
      if (act === "del")              { arr.splice(i, 1); }
      rebuild();
    });
    rebuild();
  }

  function bindObject(obj, container) {
    container.addEventListener("input", (e) => {
      const el = e.target.closest("[data-key]"); if (!el) return;
      obj[el.dataset.key] = el.dataset.tags
        ? el.value.split(",").map((s) => s.trim()).filter(Boolean)
        : el.value;
    });
  }

  /* ---------- tab renderers ---------- */
  function paneSite(container) {
    container.innerHTML =
      '<p class="admin-hint">Applies to every page: header, footer, logo.</p>' +
      '<div id="sFields"></div>' +
      '<h4 style="margin:18px 0 8px">Social links</h4>' +
      '<div id="sSocials"></div>' +
      addBtn("Add social link", "add-social");

    data.site = data.site || {};
    const f = $("#sFields", container);
    f.innerHTML =
      field("Site name (header + footer)", "name", data.site.name) +
      field("Initials in the logo square", "initials", data.site.initials) +
      field("Footer note", "footerNote", data.site.footerNote);
    bindObject(data.site, f);

    data.site.socials = data.site.socials || [];
    bindList($("#sSocials", container), data.site.socials, (s) =>
      card("link", field("Label", "label", s.label) + field("URL", "url", s.url)));

    container.querySelector('[data-act="add-social"]').addEventListener("click", () => {
      data.site.socials.push({ label: "New link", url: "https://" });
      paneSite(container);
    });
  }

  function paneHome(container) {
    data.home = data.home || {};
    container.innerHTML =
      '<div id="hFields"></div>' +
      '<h4 style="margin:18px 0 8px">Hero buttons</h4>' +
      '<div id="hActions"></div>' + addBtn("Add hero button", "add-action") +
      '<h4 style="margin:18px 0 8px">Quick facts</h4>' +
      '<div id="hFacts"></div>' + addBtn("Add fact", "add-fact") +
      '<h4 style="margin:18px 0 8px">Focus cards</h4>' +
      '<div id="hFocus"></div>' + addBtn("Add focus card", "add-focus") +
      '<h4 style="margin:18px 0 8px">“Right now” list</h4>' +
      '<div id="hNow"></div>' + addBtn("Add line", "add-now");

    const f = $("#hFields", container);
    f.innerHTML =
      field("Kicker (above headline)", "kicker", data.home.kicker) +
      field("Headline", "headline", data.home.headline) +
      field("Intro paragraph (HTML allowed)", "lede", data.home.lede, { type: "textarea", rows: 3, wide: true });
    bindObject(data.home, f);

    data.home.actions = data.home.actions || [];
    bindList($("#hActions", container), data.home.actions, (a) =>
      card("button",
        field("Label", "label", a.label) +
        field("Href", "href", a.href) +
        field("Primary? (true/false)", "primary", a.primary ? "true" : "false")));

    data.home.facts = data.home.facts || [];
    bindList($("#hFacts", container), data.home.facts, (x) =>
      card("fact", field("Key", "k", x.k) + field("Value", "v", x.v)));

    data.home.focus = data.home.focus || [];
    bindList($("#hFocus", container), data.home.focus, (x) =>
      card("focus",
        field("Title", "title", x.title) +
        field("Text", "text", x.text, { type: "textarea", rows: 2, wide: true })));

    data.home.now = data.home.now || [];
    bindList($("#hNow", container), data.home.now, (x) =>
      card("line", field("Text", "v", x.v || x)));

    container.querySelector('[data-act="add-action"]').addEventListener("click", () => {
      data.home.actions.push({ label: "New", href: "#", primary: false }); paneHome(container);
    });
    container.querySelector('[data-act="add-fact"]').addEventListener("click", () => {
      data.home.facts.push({ k: "Key", v: "Value" }); paneHome(container);
    });
    container.querySelector('[data-act="add-focus"]').addEventListener("click", () => {
      data.home.focus.push({ title: "New", text: "" }); paneHome(container);
    });
    container.querySelector('[data-act="add-now"]').addEventListener("click", () => {
      data.home.now.push(""); paneHome(container);
    });
  }

  function paneResources(container) {
    data.resources = data.resources || {};
    container.innerHTML =
      '<div id="rFields"></div>' +
      '<h4 style="margin:18px 0 8px">Manual groups</h4>' +
      '<p class="admin-hint">Groups shown <strong>after</strong> the auto-scanned course materials.</p>' +
      '<div id="rGroups"></div>' + addBtn("Add group", "add-group");

    const f = $("#rFields", container);
    f.innerHTML =
      field("Intro paragraph (HTML allowed)", "intro", data.resources.intro, { type: "textarea", rows: 3, wide: true }) +
      field("Show auto-scanned course materials? (true/false)", "showAutoCourses", data.resources.showAutoCourses !== false ? "true" : "false") +
      field("Auto-open each course group? (true/false)", "autoOpenCourses", data.resources.autoOpenCourses === true ? "true" : "false") +
      field("Auto-open manual groups? (true/false)", "autoOpenGroups", data.resources.autoOpenGroups !== false ? "true" : "false");
      field("Label above manual groups", "manualGroupsLabel", data.resources.manualGroupsLabel || "More resources");

    f.addEventListener("input", () => {
      data.resources.intro          = f.querySelector('[data-key="intro"]').value;
      data.resources.showAutoCourses = f.querySelector('[data-key="showAutoCourses"]').value.trim() === "true";
      data.resources.autoOpenCourses = f.querySelector('[data-key="autoOpenCourses"]').value.trim() === "true";
      data.resources.autoOpenGroups  = f.querySelector('[data-key="autoOpenGroups"]').value.trim() === "true";
      data.resources.manualGroupsLabel = f.querySelector('[data-key="manualGroupsLabel"]').value;
    });

    data.resources.groups = data.resources.groups || [];
    const groupsEl = $("#rGroups", container);

    function renderGroups() {
      groupsEl.innerHTML = data.resources.groups.map((g, i) =>
        '<div class="admin-card" data-group="' + i + '">' +
          '<div class="admin-card-head">' +
            '<span class="admin-card-tag">group</span>' +
            '<span class="spacer"></span>' +
            '<button class="btn-mini" data-act="g-up" type="button">↑</button>' +
            '<button class="btn-mini" data-act="g-down" type="button">↓</button>' +
            '<button class="btn-mini danger" data-act="g-del" type="button">Remove</button>' +
          "</div>" +
          field("Title", "title", g.title) +
          field("Note (small line under the title)", "note", g.note) +
          field("Open by default? (true/false)", "open", g.open ? "true" : "false") +
          '<h4 style="margin:8px 0 6px">Items</h4>' +
          '<div class="r-items" data-items="' + i + '"></div>' +
          '<button class="admin-add" data-act="i-add" data-group="' + i + '" type="button">+ Add item</button>' +
        "</div>"
      ).join("");

      data.resources.groups.forEach((g, i) => {
        g.items = g.items || [];
        bindList($('[data-items="' + i + '"]', groupsEl), g.items, (it) =>
          card("item",
            field("Name", "name", it.name) +
            field("Description", "desc", it.desc, { type: "textarea", rows: 2, wide: true }) +
            field("Href", "href", it.href) +
            field("Tags", "tags", it.tags, { type: "tags" }) +
            field("Meta (right-aligned, optional)", "meta", it.meta)));
      });
    }

    groupsEl.addEventListener("click", (e) => {
      const add = e.target.closest('[data-act="i-add"]');
      if (add) {
        const gi = +add.dataset.group;
        data.resources.groups[gi].items = data.resources.groups[gi].items || [];
        data.resources.groups[gi].items.push({ name: "New item", href: "#" });
        renderGroups();
        return;
      }
      const btn = e.target.closest('[data-act^="g-"]'); if (!btn) return;
      const wrap = btn.closest('[data-group]');
      const i = +wrap.dataset.group;
      // commit current values first
      $$(".admin-card[data-group='" + i + "'] > .admin-field input, .admin-card[data-group='" + i + "'] > .admin-field textarea", groupsEl)
        .forEach((el) => {
          const key = el.dataset.key;
          if (!key) return;
          if (key === "open") data.resources.groups[i].open = el.value.trim() === "true";
          else data.resources.groups[i][key] = el.value;
        });
      const act = btn.dataset.act;
      if (act === "g-up" && i > 0) { const t = data.resources.groups[i-1]; data.resources.groups[i-1] = data.resources.groups[i]; data.resources.groups[i] = t; }
      if (act === "g-down" && i < data.resources.groups.length - 1) { const t = data.resources.groups[i+1]; data.resources.groups[i+1] = data.resources.groups[i]; data.resources.groups[i] = t; }
      if (act === "g-del") data.resources.groups.splice(i, 1);
      renderGroups();
    });

    groupsEl.addEventListener("input", (e) => {
      const wrap = e.target.closest("[data-group]"); if (!wrap) return;
      const i = +wrap.dataset.group;
      const el = e.target.closest("[data-key]"); if (!el) return;
      if (el.closest(".r-items")) return; // handled by bindList
      const key = el.dataset.key;
      if (key === "open") data.resources.groups[i].open = el.value.trim() === "true";
      else data.resources.groups[i][key] = el.value;
    });

    container.querySelector('[data-act="add-group"]').addEventListener("click", () => {
      data.resources.groups.push({ title: "New group", note: "", open: true, items: [] });
      renderGroups();
    });

    renderGroups();
  }

  function paneBlogs(container) {
    data.blogs = data.blogs || { intro: "", posts: [] };
    container.innerHTML =
      '<div id="bFields"></div>' +
      '<h4 style="margin:18px 0 8px">Posts</h4>' +
      '<p class="admin-hint">Slug is the URL fragment. Keep it lowercase with dashes. Body supports markdown: <code>## headings</code>, <code>- lists</code>, <code>**bold**</code>, <code>[links](url)</code>.</p>' +
      '<div id="bPosts"></div>' + addBtn("Add post", "add-post");

    const f = $("#bFields", container);
    f.innerHTML = field("Intro paragraph", "intro", data.blogs.intro, { type: "textarea", rows: 2, wide: true });
    bindObject(data.blogs, f);

    data.blogs.posts = data.blogs.posts || [];
    bindList($("#bPosts", container), data.blogs.posts, (p) =>
      card(p.slug || "post",
        '<div class="admin-grid-2">' +
          field("Title", "title", p.title) +
          field("Slug", "slug", p.slug) +
          field("Date (YYYY-MM-DD)", "date", p.date) +
          field("Tags", "tags", p.tags, { type: "tags" }) +
        "</div>" +
        field("Excerpt", "excerpt", p.excerpt, { type: "textarea", rows: 2, wide: true }) +
        field("Body (markdown)", "body", p.body, { type: "textarea", rows: 12, wide: true })));

    container.querySelector('[data-act="add-post"]').addEventListener("click", () => {
      const d = new Date().toISOString().slice(0, 10);
      data.blogs.posts.unshift({
        slug: "new-post-" + Date.now().toString(36),
        title: "New post", date: d, tags: [], excerpt: "", body: ""
      });
      paneBlogs(container);
    });
  }

  function paneHelp(container) {
    data.help = data.help || { intro: "", faqs: [], contacts: [] };
    container.innerHTML =
      '<div id="hpFields"></div>' +
      '<h4 style="margin:18px 0 8px">FAQ entries</h4>' +
      '<div id="hpFaqs"></div>' + addBtn("Add FAQ", "add-faq") +
      '<h4 style="margin:18px 0 8px">Contact links</h4>' +
      '<div id="hpContacts"></div>' + addBtn("Add contact", "add-contact");

    const f = $("#hpFields", container);
    f.innerHTML = field("Intro paragraph", "intro", data.help.intro, { type: "textarea", rows: 2, wide: true });
    bindObject(data.help, f);

    data.help.faqs = data.help.faqs || [];
    bindList($("#hpFaqs", container), data.help.faqs, (x) =>
      card("faq",
        field("Question", "q", x.q) +
        field("Answer (HTML allowed)", "a", x.a, { type: "textarea", rows: 4, wide: true })));

    data.help.contacts = data.help.contacts || [];
    bindList($("#hpContacts", container), data.help.contacts, (x) =>
      card("contact",
        field("Label", "label", x.label) +
        field("Displayed value", "value", x.value) +
        field("Href", "href", x.href)));

    container.querySelector('[data-act="add-faq"]').addEventListener("click", () => {
      data.help.faqs.push({ q: "New question", a: "" }); paneHelp(container);
    });
    container.querySelector('[data-act="add-contact"]').addEventListener("click", () => {
      data.help.contacts.push({ label: "Email", value: "", href: "" }); paneHelp(container);
    });
  }

  function paneMaterials(container) {
    const courses = (MAT && MAT.courses) || [];
    let html = '<p class="admin-hint">Read-only. These come from the local <code>materials/</code> folder via <code>tools/build-materials.js</code>. To change anything here, edit the folder (or <code>course.json</code>) and rerun the script.</p>';

    if (MAT.generatedAt) html += '<p class="admin-hint">Last scan: <code>' + esc(MAT.generatedAt) + "</code></p>";
    else                 html += '<p class="admin-hint">No scan yet. Run the build script.</p>';

    if (!courses.length) {
      html += '<div class="empty" style="margin-top:12px">No courses found under <code>materials/</code>.</div>';
    } else {
      html += courses.map((c) => {
        const files = (c.sections || []).reduce((n, s) => n + (s.files || []).length, 0);
        return '<div class="materials-preview">' +
          "<h4>" + esc(c.code || c.slug) + " — " + esc(c.title) + "</h4>" +
          '<p class="meta">' + esc(c.slug) + " · " + files + " file(s) · " +
            (c.sections || []).map((s) => esc(s.name) + " (" + (s.files || []).length + ")").join(", ") +
          "</p>" +
          '<p style="margin:6px 0 0;font-size:13px;color:var(--sub)">' + esc(c.description || "") + "</p>" +
        "</div>";
      }).join("");
    }
    container.innerHTML = html;
  }

  function paneData(container) {
    container.innerHTML =
      '<p class="admin-hint">The full contents of <code>assets/js/site-data.js</code>. Apply to preview, then download to overwrite the file.</p>' +
      '<div class="admin-field admin-field-wide"><textarea id="adminJson" spellcheck="false" style="min-height:400px"></textarea></div>';
    const ta = $("#adminJson", container);
    ta.value = JSON.stringify(data, null, 2);
    ta.addEventListener("input", () => {
      const st = $("#adminStatus"); if (st) { st.textContent = "Unsaved changes."; st.className = "admin-status"; }
    });
  }

  const PANES = {
    site: paneSite, home: paneHome, resources: paneResources,
    blogs: paneBlogs, help: paneHelp, materials: paneMaterials, data: paneData
  };

  /* ---------- overlay ---------- */
  function openAdmin() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "admin-overlay";
    overlay.innerHTML =
      '<div class="admin-panel" role="dialog" aria-modal="true" aria-label="Site admin">' +
        '<div class="admin-head">' +
          "<h2>Site admin</h2>" +
          '<span class="spacer"></span>' +
          '<button class="btn" id="adminClose" type="button">Close</button>' +
        "</div>" +
        '<div class="admin-tabs" role="tablist">' +
          TABS.map(([id, label]) =>
            '<button class="admin-tab" role="tab" data-tab="' + id + '" aria-selected="' +
            (id === activeTab) + '">' + esc(label) + "</button>").join("") +
        "</div>" +
        '<div class="admin-body"><div class="admin-pane" id="adminPane"></div></div>' +
        '<div class="admin-foot">' +
          '<button class="btn btn-primary" id="adminApply" type="button">Apply to page</button>' +
          '<button class="btn" id="adminDownload" type="button">Download site-data.js</button>' +
          '<button class="btn" id="adminReload" type="button">Discard changes</button>' +
          '<span class="admin-status" id="adminStatus">Editing in memory only.</span>' +
        "</div>" +
      "</div>";

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const pane = $("#adminPane", overlay);

    function setStatus(msg, kind) {
      const el = $("#adminStatus", overlay);
      el.textContent = msg;
      el.className = "admin-status" + (kind ? " " + kind : "");
    }

    function showTab(id) {
      activeTab = id;
      $$(".admin-tab", overlay).forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === id)));
      pane.innerHTML = "";
      (PANES[id] || paneSite)(pane);
      setStatus("Editing in memory only.", "");
    }

    $$(".admin-tab", overlay).forEach((t) =>
      t.addEventListener("click", () => showTab(t.dataset.tab)));

    $("#adminApply", overlay).addEventListener("click", () => {
      // If we're on the raw JSON tab, parse and replace
      const raw = $("#adminJson", pane);
      if (raw && document.activeElement === raw) {
        try {
          const parsed = JSON.parse(raw.value);
          if (!parsed || typeof parsed !== "object") throw new Error("Root must be an object");
          data = parsed;
        } catch (err) { setStatus("JSON error: " + err.message, "err"); return; }
      }
      render();
      setStatus("Applied. Download to keep it.", "ok");
    });

    $("#adminDownload", overlay).addEventListener("click", () => {
      const header =
        "/* =========================================================\n" +
        "   site-data.js  —  ALL site content lives here.\n" +
        "   Generated by the admin panel on " + new Date().toISOString().slice(0, 10) + ".\n" +
        "   ========================================================= */\n\n";
      const body = "const SITE_DATA = " + JSON.stringify(data, null, 2) + ";\n";
      const blob = new Blob([header + body], { type: "text/javascript;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "site-data.js";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 800);
      setStatus("Downloaded. Replace assets/js/site-data.js with it.", "ok");
    });

    $("#adminReload", overlay).addEventListener("click", () => {
      if (typeof SITE_DATA !== "undefined") data = clone(SITE_DATA);
      showTab(activeTab);
      render();
      setStatus("Reverted to the values from site-data.js.", "ok");
    });

    function close() {
      overlay.remove(); overlay = null;
      document.body.style.overflow = "";
    }
    $("#adminClose", overlay).addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function onEsc(e) {
      if (!overlay) { document.removeEventListener("keydown", onEsc); return; }
      if (e.key === "Escape") close();
    });

    showTab(activeTab);
  }

  /* ---------------- boot ---------------- */
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();