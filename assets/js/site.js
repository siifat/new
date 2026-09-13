/* =========================================================
   site.js — rendering and theme for the public pages.
   The admin panel lives in /admin/ and has its own script.
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
  const data = (typeof SITE_DATA !== "undefined") ? SITE_DATA : null;
  const MAT = (typeof window.MATERIALS_INDEX !== "undefined")
    ? window.MATERIALS_INDEX
    : { courses: [] };

  if (!data) {
    document.addEventListener("DOMContentLoaded", () => {
      const m = $("#main");
      if (m) m.innerHTML = '<div class="empty">Missing <code>assets/js/site-data.js</code>.</div>';
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
          '<span class="chev">' + CHEV_SVG + "</span>" +
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

  /* ---------------- boot ---------------- */
  function boot() {
    render();
    initTheme();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();