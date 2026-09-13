/* =========================================================
   admin/admin.js — standalone editor for site-data.js.
   Loads SITE_DATA and MATERIALS_INDEX from ../assets/js/.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- helpers ---------------- */
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc  = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  const attr = (v) => esc(v);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------- state ---------------- */
  // SITE_DATA is declared with `const` at the top level of
  // site-data.js, so it is visible here but NOT on window.
  // Referencing the bare identifier works because the script
  // was loaded before this one.
  const original = (typeof SITE_DATA !== "undefined") ? SITE_DATA : null;
  const MAT = (typeof window.MATERIALS_INDEX !== "undefined")
    ? window.MATERIALS_INDEX
    : { courses: [] };

  if (!original) {
    document.body.innerHTML =
      '<p style="padding:32px;font:14px/1.5 system-ui">' +
      'Could not load <code>../assets/js/site-data.js</code>. ' +
      "Make sure the file exists and the path is correct.</p>";
    return;
  }

  let data = clone(original);

  /* ---------------- DOM builders ---------------- */
  function field(label, key, value, opts) {
    opts = opts || {};
    const cls = "admin-field" + (opts.wide ? " admin-field-wide" : "");
    if (opts.type === "textarea") {
      return '<div class="' + cls + '"><label>' + esc(label) + "</label>" +
        '<textarea data-key="' + attr(key) + '" rows="' + (opts.rows || 3) + '" spellcheck="false">' +
        esc(value || "") + "</textarea></div>";
    }
    if (opts.type === "tags") {
      return '<div class="' + cls + '"><label>' + esc(label) +
        ' <span style="opacity:.5">(comma separated)</span></label>' +
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
    '<button class="admin-add" data-act="' + act + '" type="button">+ ' +
    esc(label) + "</button>";

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
      dirty();
    });
    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]"); if (!btn) return;
      const cardEl = btn.closest(".admin-card"); if (!cardEl) return;
      const i = $$(".admin-card", listEl).indexOf(cardEl);
      const act = btn.dataset.act;
      commitCard(cardEl, i);
      if (act === "up" && i > 0)                 { const t = arr[i-1]; arr[i-1] = arr[i]; arr[i] = t; }
      if (act === "down" && i < arr.length - 1)  { const t = arr[i+1]; arr[i+1] = arr[i]; arr[i] = t; }
      if (act === "dup")                         { arr.splice(i + 1, 0, clone(arr[i])); }
      if (act === "del")                         { arr.splice(i, 1); }
      rebuild();
      dirty();
    });
    rebuild();
  }

  function bindObject(obj, container) {
    container.addEventListener("input", (e) => {
      const el = e.target.closest("[data-key]"); if (!el) return;
      obj[el.dataset.key] = el.dataset.tags
        ? el.value.split(",").map((s) => s.trim()).filter(Boolean)
        : el.value;
      dirty();
    });
  }

  /* ---------------- panes ---------------- */
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
      card("link",
        field("Label", "label", s.label) +
        field("URL", "url", s.url)));

    container.querySelector('[data-act="add-social"]').addEventListener("click", () => {
      data.site.socials.push({ label: "New link", url: "https://" });
      paneSite(container);
      dirty();
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
      field("Intro paragraph (HTML allowed)", "lede", data.home.lede,
        { type: "textarea", rows: 3, wide: true });
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
      data.home.actions.push({ label: "New", href: "#", primary: false });
      paneHome(container); dirty();
    });
    container.querySelector('[data-act="add-fact"]').addEventListener("click", () => {
      data.home.facts.push({ k: "Key", v: "Value" }); paneHome(container); dirty();
    });
    container.querySelector('[data-act="add-focus"]').addEventListener("click", () => {
      data.home.focus.push({ title: "New", text: "" }); paneHome(container); dirty();
    });
    container.querySelector('[data-act="add-now"]').addEventListener("click", () => {
      data.home.now.push(""); paneHome(container); dirty();
    });
  }

  function paneResources(container) {
    data.resources = data.resources || {};
    container.innerHTML =
      '<div id="rFields"></div>' +
      '<h4 style="margin:18px 0 8px">Manual groups</h4>' +
      '<p class="admin-hint">Groups shown <strong>after</strong> the auto-scanned course materials.</p>' +
      '<div id="rGroups"></div>' +
      addBtn("Add group", "add-group");

    const f = $("#rFields", container);
    f.innerHTML =
      field("Intro paragraph (HTML allowed)", "intro", data.resources.intro,
        { type: "textarea", rows: 3, wide: true }) +
      field("Show auto-scanned course materials? (true/false)", "showAutoCourses",
        data.resources.showAutoCourses !== false ? "true" : "false") +
      field("Auto-open each course group? (true/false)", "autoOpenCourses",
        data.resources.autoOpenCourses === true ? "true" : "false") +
      field("Auto-open manual groups? (true/false)", "autoOpenGroups",
        data.resources.autoOpenGroups !== false ? "true" : "false") +
      field("Label above manual groups", "manualGroupsLabel",
        data.resources.manualGroupsLabel || "More resources");

    f.addEventListener("input", () => {
      data.resources.intro             = f.querySelector('[data-key="intro"]').value;
      data.resources.showAutoCourses   = f.querySelector('[data-key="showAutoCourses"]').value.trim() === "true";
      data.resources.autoOpenCourses   = f.querySelector('[data-key="autoOpenCourses"]').value.trim() === "true";
      data.resources.autoOpenGroups    = f.querySelector('[data-key="autoOpenGroups"]').value.trim() === "true";
      data.resources.manualGroupsLabel = f.querySelector('[data-key="manualGroupsLabel"]').value;
      dirty();
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
        renderGroups(); dirty();
        return;
      }
      const btn = e.target.closest('[data-act^="g-"]'); if (!btn) return;
      const wrap = btn.closest('[data-group]');
      const i = +wrap.dataset.group;
      $$(".admin-card[data-group='" + i + "'] > .admin-field input, " +
         ".admin-card[data-group='" + i + "'] > .admin-field textarea", groupsEl)
        .forEach((el) => {
          const key = el.dataset.key;
          if (!key) return;
          if (key === "open") data.resources.groups[i].open = el.value.trim() === "true";
          else data.resources.groups[i][key] = el.value;
        });
      const act = btn.dataset.act;
      if (act === "g-up" && i > 0) {
        const t = data.resources.groups[i-1];
        data.resources.groups[i-1] = data.resources.groups[i];
        data.resources.groups[i] = t;
      }
      if (act === "g-down" && i < data.resources.groups.length - 1) {
        const t = data.resources.groups[i+1];
        data.resources.groups[i+1] = data.resources.groups[i];
        data.resources.groups[i] = t;
      }
      if (act === "g-del") data.resources.groups.splice(i, 1);
      renderGroups(); dirty();
    });

    groupsEl.addEventListener("input", (e) => {
      const wrap = e.target.closest("[data-group]"); if (!wrap) return;
      const i = +wrap.dataset.group;
      const el = e.target.closest("[data-key]"); if (!el) return;
      if (el.closest(".r-items")) return; // handled by bindList
      const key = el.dataset.key;
      if (key === "open") data.resources.groups[i].open = el.value.trim() === "true";
      else data.resources.groups[i][key] = el.value;
      dirty();
    });

    container.querySelector('[data-act="add-group"]').addEventListener("click", () => {
      data.resources.groups.push({ title: "New group", note: "", open: true, items: [] });
      renderGroups(); dirty();
    });

    renderGroups();
  }

  function paneBlogs(container) {
    data.blogs = data.blogs || { intro: "", posts: [] };
    container.innerHTML =
      '<div id="bFields"></div>' +
      '<h4 style="margin:18px 0 8px">Posts</h4>' +
      '<p class="admin-hint">Slug is the URL fragment. Keep it lowercase with dashes. ' +
      'Body supports markdown: <code>## headings</code>, <code>- lists</code>, ' +
      '<code>**bold**</code>, <code>[links](url)</code>.</p>' +
      '<div id="bPosts"></div>' +
      addBtn("Add post", "add-post");

    const f = $("#bFields", container);
    f.innerHTML = field("Intro paragraph", "intro", data.blogs.intro,
      { type: "textarea", rows: 2, wide: true });
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
      paneBlogs(container); dirty();
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
    f.innerHTML = field("Intro paragraph", "intro", data.help.intro,
      { type: "textarea", rows: 2, wide: true });
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
      data.help.faqs.push({ q: "New question", a: "" }); paneHelp(container); dirty();
    });
    container.querySelector('[data-act="add-contact"]').addEventListener("click", () => {
      data.help.contacts.push({ label: "Email", value: "", href: "" });
      paneHelp(container); dirty();
    });
  }

  function paneMaterials(container) {
    const courses = (MAT && MAT.courses) || [];
    let html =
      '<p class="admin-hint">Read-only. These come from the local <code>materials/</code> ' +
      "folder via <code>tools/build-materials.js</code>. To change anything here, edit " +
      "the folder (or <code>course.json</code>) and rerun the script.</p>";

    if (MAT.generatedAt)
      html += '<p class="admin-hint">Last scan: <code>' + esc(MAT.generatedAt) + "</code></p>";
    else
      html += '<p class="admin-hint">No scan yet. Run the build script.</p>';

    if (!courses.length) {
      html += '<div class="empty" style="margin-top:12px">No courses found under ' +
              "<code>materials/</code>.</div>";
    } else {
      html += courses.map((c) => {
        const files = (c.sections || []).reduce((n, s) => n + (s.files || []).length, 0);
        return '<div class="materials-preview">' +
          "<h4>" + esc(c.code || c.slug) + " — " + esc(c.title) + "</h4>" +
          '<p class="meta">' + esc(c.slug) + " · " + files + " file(s) · " +
            (c.sections || []).map((s) =>
              esc(s.name) + " (" + (s.files || []).length + ")").join(", ") +
          "</p>" +
          '<p style="margin:6px 0 0;font-size:13px;color:var(--sub)">' +
            esc(c.description || "") + "</p>" +
        "</div>";
      }).join("");
    }
    container.innerHTML = html;
  }

  function paneData(container) {
    container.innerHTML =
      '<p class="admin-hint">The full contents of <code>assets/js/site-data.js</code>. ' +
      "Download to overwrite the file.</p>" +
      '<div class="admin-field admin-field-wide">' +
      '<textarea id="adminJson" spellcheck="false" style="min-height:520px"></textarea></div>';

    const ta = $("#adminJson", container);
    ta.value = JSON.stringify(data, null, 2);
    ta.addEventListener("input", () => {
      try {
        const parsed = JSON.parse(ta.value);
        if (parsed && typeof parsed === "object") {
          data = parsed;
          dirty();
        }
      } catch (_) {
        setStatus("Invalid JSON — fix before downloading.", "err");
      }
    });
  }

  /* ---------------- tab wiring ---------------- */
  const TABS = [
    ["site",      "Site"],
    ["home",      "Home"],
    ["resources", "Resources"],
    ["blogs",     "Blogs"],
    ["help",      "Help"],
    ["materials", "Materials"],
    ["data",      "Raw JSON"]
  ];

  const PANES = {
    site: paneSite, home: paneHome, resources: paneResources,
    blogs: paneBlogs, help: paneHelp, materials: paneMaterials, data: paneData
  };

  let activeTab = "site";

  const tabsEl  = $("#adminTabs");
  const paneEl  = $("#adminPane");
  const statusEl = $("#adminStatus");

  tabsEl.innerHTML = TABS.map(([id, label]) =>
    '<button class="admin-tab" role="tab" data-tab="' + id + '" ' +
    'aria-selected="' + (id === activeTab) + '">' + esc(label) + "</button>"
  ).join("");

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "admin-status" + (kind ? " " + kind : "");
  }

  function dirty() {
    setStatus("Unsaved changes.", "");
  }

  function showTab(id) {
    activeTab = id;
    $$(".admin-tab", tabsEl).forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.tab === id)));
    paneEl.innerHTML = "";
    (PANES[id] || paneSite)(paneEl);
    setStatus("Editing in memory only.", "");
  }

  tabsEl.addEventListener("click", (e) => {
    const t = e.target.closest(".admin-tab");
    if (t) showTab(t.dataset.tab);
  });

  /* ---------------- actions ---------------- */
  $("#adminDownload").addEventListener("click", () => {
    const header =
      "/* =========================================================\n" +
      "   site-data.js  —  ALL site content lives here.\n" +
      "   Generated by the admin panel on " +
      new Date().toISOString().slice(0, 10) + ".\n" +
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
    setTimeout(() => URL.revokeObjectURL(url), 800);

    setStatus("Downloaded. Drop it into assets/js/site-data.js.", "ok");
  });

  $("#adminReset").addEventListener("click", () => {
    if (!confirm("Discard all unsaved changes?")) return;
    data = clone(original);
    showTab(activeTab);
    setStatus("Reverted to the values in site-data.js.", "ok");
  });

  $("#themeBtn").addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("site-theme", dark ? "dark" : "light"); } catch (e) {}
  });

  /* ---------------- warn before leaving with unsaved changes ------------- */
  window.addEventListener("beforeunload", (e) => {
    if (statusEl.classList.contains("ok") || statusEl.textContent === "Editing in memory only.") return;
    e.preventDefault();
    e.returnValue = "";
  });

  /* ---------------- boot ---------------- */
  showTab(activeTab);
})();