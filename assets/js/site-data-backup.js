/* =========================================================
   site-data.js  —  ALL site content lives here.
   Edit by hand, or open the admin panel (Ctrl/Cmd+Shift+A)
   and download a fresh copy of this file.
   ========================================================= */

const SITE_DATA = {

  /* ---------- global ---------- */
  site: {
    name: "Your Name",
    initials: "YN",
    footerNote: "Plain HTML, CSS and JS. No trackers.",
    socials: [
      { label: "GitHub",   url: "https://github.com/yourusername" },
      { label: "LinkedIn", url: "https://linkedin.com/in/yourusername" },
      { label: "Email",    url: "mailto:you@example.com" }
    ]
  },

  /* ---------- home ---------- */
  home: {
    kicker: "CSE Undergraduate · United International University",
    headline: "Hi, I'm Your Name.",
    lede: "I build small, fast things for the web and write about what I learn along the way. This site is where I keep my <strong>course resources</strong>, notes and occasional blog posts.",
    actions: [
      { label: "UIU Resources", href: "resources.html", primary: true },
      { label: "Read the blog", href: "blogs.html" },
      { label: "Get in touch",  href: "help.html" }
    ],
    facts: [
      { k: "Program",  v: "BSc in CSE" },
      { k: "University", v: "UIU" },
      { k: "Trimester", v: "Spring 2026" },
      { k: "Focus",    v: "Web · Testing · Databases" },
      { k: "Status",   v: "Open to internships" }
    ],
    focus: [
      { title: "Web Development",  text: "Semantic HTML, modern CSS and vanilla JS. I prefer shipping a 20 KB page over a 2 MB bundle." },
      { title: "Software Testing", text: "Unit, structural and system testing. Currently going deep on API test automation." },
      { title: "Databases",        text: "Relational design, normalisation and query tuning in MySQL and PostgreSQL." }
    ],
    now: [
      "Working through the CSE 4495 (STQA) course materials.",
      "Rebuilding my notes into a searchable format.",
      "Learning Postman collections and CI test runs."
    ]
  },

  /* ---------- UIU resources ---------- */
  resources: {
    intro: "Everything I have collected for my own courses, sorted and kept up to date. Links open in a new tab.",
    groups: [
      {
        title: "Course Materials",
        note: "Slides, decks and lecture notes",
        items: [
          { name: "CSE 4495 — Software Testing & Quality Assurance", desc: "Full lecture deck set, L01 through L06.", href: "https://example.com/stqa", tags: ["CSE 4495", "Slides"], meta: "6 decks" },
          { name: "CSE 3411 — Database Management Systems", desc: "Relational model, SQL, normalisation, transactions.", href: "https://example.com/dbms", tags: ["CSE 3411", "Slides"], meta: "12 decks" },
          { name: "CSE 1112 — Computer Architecture", desc: "Datapath, pipelining, memory hierarchy.", href: "https://example.com/ca", tags: ["CSE 1112", "Notes"], meta: "8 decks" },
          { name: "Operating Systems Laboratory", desc: "Shell scripting, process scheduling, memory management.", href: "https://example.com/os-lab", tags: ["Lab", "CSE 2212"], meta: "Lab manual" }
        ]
      },
      {
        title: "Class Tests & Finals",
        note: "Previous question papers",
        items: [
          { name: "STQA — Class Test 1 & 2 archive", desc: "Summer 2025, Fall 2025 and Spring 2026 papers.", href: "https://example.com/ct", tags: ["STQA", "PDF"], meta: "14 files" },
          { name: "STQA — Final question archive", desc: "232 through 261 trimesters.", href: "https://example.com/final", tags: ["STQA", "PDF"], meta: "9 files" },
          { name: "DBMS — Final question archive", desc: "Collected from the last five trimesters.", href: "https://example.com/dbms-final", tags: ["DBMS", "PDF"], meta: "11 files" }
        ]
      },
      {
        title: "Tools & Setup",
        note: "Things I install on every machine",
        items: [
          { name: "Postman collection — Panda Lite", desc: "API testing playground used for the system testing assignment.", href: "https://example.com/postman", tags: ["Testing", "API"] },
          { name: "VS Code settings & extensions", desc: "My editor config, kept in a public gist.", href: "https://example.com/vscode", tags: ["Setup"] },
          { name: "Git cheat sheet", desc: "The twenty commands I actually use.", href: "https://example.com/git", tags: ["Reference"] }
        ]
      },
      {
        title: "UIU Academic Links",
        note: "Official portals",
        items: [
          { name: "UCAM", desc: "Course registration, results and advising.", href: "https://ucam.uiu.ac.bd", tags: ["Official"] },
          { name: "UMS", desc: "Student portal for attendance and grades.", href: "https://ums.uiu.ac.bd", tags: ["Official"] },
          { name: "Library", desc: "E-resources and past papers.", href: "https://library.uiu.ac.bd", tags: ["Official"] }
        ]
      }
    ]
  },

  /* ---------- blogs ---------- */
  blogs: {
    intro: "Short write-ups about coursework, side projects and things that took me too long to understand.",
    posts: [
      {
        slug: "why-i-write-plain-html",
        title: "Why I write plain HTML in 2026",
        date: "2026-08-24",
        tags: ["Web", "Opinion"],
        excerpt: "A framework is a loan against your future flexibility. Sometimes the interest is worth it — often it is not.",
        body: "I keep rebuilding the same personal site. Every version, I try a new framework, and every version I end up ripping it back out.\n\n## The problem is rarely the framework\n\nThe real cost is not download size. It is the **decision surface**. With plain HTML you open a file, type a tag, and you are done. With a framework you first decide how data flows, where state lives, and which of the four documented ways to fetch something is the blessed one this month.\n\n## What I do instead\n\n- Write semantic HTML first, style it second.\n- Keep one CSS file. No preprocessor until it actually hurts.\n- Ship content as a single JS object, render it on load.\n\nThat last one is the trick. You get the ergonomics of a CMS — edit one file, everything updates — without a build step.\n\nThe page you are reading right now is about 12 KB of CSS, 8 KB of JS and zero dependencies."
      },
      {
        slug: "system-testing-checklist",
        title: "A system testing checklist I actually use",
        date: "2026-07-11",
        tags: ["Testing", "CSE 4495"],
        excerpt: "Six questions to ask before you write a single test case for an API or a web application.",
        body: "System testing is where most student projects fall apart. Not because the code is broken, but because nobody defined what *working* means.\n\n## The six questions\n\n- What is the entry point for this feature, and who can reach it?\n- What happens on a request with a valid body but an invalid content type?\n- What happens when the same request is sent twice?\n- Which fields are required, and what does the error look like when one is missing?\n- What is the expected response **status code**, not just the response body?\n- Where does this feature touch the database, and what happens if that write fails?\n\n## Why status codes matter\n\nMost teams assert on the JSON body and ignore the status. Then a validation failure returns `200` with an error field, and every downstream client has to special-case it.\n\nWrite the status assertion first. The rest follows."
      },
      {
        slug: "notes-on-normalisation",
        title: "Notes on normalisation, up to 3NF",
        date: "2026-05-02",
        tags: ["Databases", "Notes"],
        excerpt: "A compressed revision sheet for 1NF, 2NF and 3NF, with the dependency rules spelled out.",
        body: "Normalisation is mostly about one idea: **every fact should live in exactly one place**.\n\n## 1NF — atomic values\n\nNo repeating groups, no lists in a column. If a cell contains multiple values, it is not in 1NF.\n\n## 2NF — no partial dependency\n\nThe table must be in 1NF, and every non-key attribute must depend on the **whole** primary key. This only bites when you have a composite key.\n\n## 3NF — no transitive dependency\n\nNo non-key attribute should depend on another non-key attribute. If `A -> B` and `B -> C`, then `C` belongs in a different table.\n\n## The shortcut\n\nFor each table, write the functional dependencies as `X -> Y`. Then ask: is the left-hand side a superkey? If not, and the right-hand side is not a prime attribute, you are in violation of 3NF.\n\nThat single question catches almost every exam question."
      }
    ]
  },

  /* ---------- help ---------- */
  help: {
    intro: "Answers to the questions I get most often, plus the fastest ways to reach me.",
    faqs: [
      { q: "Can I use your notes and slides?", a: "<p>Yes. Everything on the UIU Resources page is shared so that other students can use it. A link back is appreciated but not required.</p>" },
      { q: "Some resource links are broken.", a: "<p>Send me the course code and the name of the file. I usually fix link rot within a day or two.</p>" },
      { q: "Will you solve my assignment?", a: "<p>No. I am happy to explain a concept, review your approach, or point you at the right lecture — but the work has to be yours.</p>" },
      { q: "How is this site built?", a: "<p>Plain HTML, one CSS file and two small JavaScript files. All content lives in a single data file, so the whole site can be updated without a build step. No frameworks, no trackers, no fonts downloaded from a third party.</p>" },
      { q: "Can I reuse the site template?", a: "<p>Sure. View source, take what is useful, and change the colours and content to suit yourself.</p>" }
    ],
    contacts: [
      { label: "Email",     value: "you@example.com",                 href: "mailto:you@example.com" },
      { label: "GitHub",    value: "github.com/yourusername",          href: "https://github.com/yourusername" },
      { label: "LinkedIn",  value: "linkedin.com/in/yourusername",     href: "https://linkedin.com/in/yourusername" },
      { label: "WhatsApp",  value: "Message me (course group)",        href: "https://wa.me/8801000000000" }
    ]
  }
};