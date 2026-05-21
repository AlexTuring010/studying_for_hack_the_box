/* ============================================================
   CTF Platform — Study Site
   app.js  ·  curriculum data, navigation, progress, page chrome
   Classic script (no modules) so it runs straight from file://.
   ============================================================ */
(function () {
  "use strict";

  /* ---- tiny DOM helper -------------------------------------- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null) continue;
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else if (k === "text") n.textContent = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function")
          n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v);
      }
    }
    if (children != null) {
      if (!Array.isArray(children)) children = [children];
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c == null) continue;
        n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return n;
  }

  /* ============================================================
     CURRICULUM — single source of truth for nav + the home map.
     Add a concept here when you teach it; that's all the wiring.
       state:  "available" | "locked"
     ============================================================ */
  var CURRICULUM = [
    {
      code: "M1", title: "Plumbing", state: "active",
      blurb: "A Laravel backend and a Vue frontend running locally and exchanging one piece of data.",
      concepts: [
        {
          code: "M1-01", id: "m1-01",
          title: "Getting Laravel Running",
          sub: "What a backend is, install the toolchain, first run",
          file: "m1-01-getting-laravel-running.html",
          state: "available"
        }
      ]
    },
    {
      code: "M2", title: "Users Exist", state: "locked",
      blurb: "Registration, login, auth tokens, and the Vue forms and auth state behind them.",
      concepts: []
    },
    {
      code: "M3", title: "Challenges Exist", state: "locked",
      blurb: "A challenges table and migration, a list API, and a Vue page that renders it.",
      concepts: []
    },
    {
      code: "M4", title: "The Solve Loop", state: "locked",
      blurb: "Submit a flag, hash and validate it server-side, record the solve, award points.",
      concepts: []
    },
    {
      code: "M5", title: "It's a Platform", state: "locked", badge: "mvp",
      blurb: "Leaderboard, several static challenges, polish. The shippable MVP.",
      concepts: []
    },
    {
      code: "M6", title: "Real Hacking", state: "locked",
      blurb: "Dockerize one or two vulnerable web apps as live challenges.",
      concepts: []
    }
  ];

  /* ============================================================
     Progress store (localStorage). Survives reloads; per-machine.
     ============================================================ */
  var Progress = {
    _key: function (id) { return "ctf.study.progress." + id; },
    get: function (id) {
      try { return JSON.parse(localStorage.getItem(this._key(id))) || {}; }
      catch (e) { return {}; }
    },
    set: function (id, obj) {
      try { localStorage.setItem(this._key(id), JSON.stringify(obj)); }
      catch (e) { /* storage may be blocked; fail quiet */ }
    },
    isComplete: function (id) { return !!this.get(id).__complete; }
  };
  window.StudyProgress = Progress;
  window.StudyEl = el;

  /* ============================================================
     Sidebar (concept pages)
     ============================================================ */
  function renderSidebar() {
    var host = document.getElementById("sidebar-nav");
    if (!host) return;
    var current = document.body.getAttribute("data-page");

    CURRICULUM.forEach(function (ms) {
      var group = el("div", { class: "nav-group" });
      group.appendChild(el("div", {
        class: "nav-milestone" + (ms.state === "locked" ? " is-locked" : "")
      }, [
        el("span", { class: "ms-code", text: ms.code }),
        el("span", { text: ms.title })
      ]));

      if (ms.concepts.length === 0) {
        group.appendChild(el("div", { class: "nav-link is-locked" }, [
          el("span", { class: "nav-dot" }),
          el("span", { text: "Not unlocked yet" }),
          el("span", { class: "nav-lock", text: "🔒" })
        ]));
      }

      ms.concepts.forEach(function (c) {
        if (c.state === "locked") {
          group.appendChild(el("div", { class: "nav-link is-locked" }, [
            el("span", { class: "nav-dot" }),
            el("span", { text: c.title }),
            el("span", { class: "nav-lock", text: "🔒" })
          ]));
          return;
        }
        var done = Progress.isComplete(c.id);
        var isCur = c.id === current;
        group.appendChild(el("a", {
          class: "nav-link" + (isCur ? " is-current" : "") + (done ? " is-done" : ""),
          href: c.file
        }, [
          el("span", { class: "nav-dot" }),
          el("span", { text: c.title }),
          done ? el("span", { class: "nav-check", text: "✓" }) : null
        ]));
      });

      host.appendChild(group);
    });
  }

  /* ============================================================
     Curriculum map (home page)
     ============================================================ */
  function renderCurriculumMap() {
    var host = document.getElementById("curriculum-map");
    if (!host) return;

    CURRICULUM.forEach(function (ms) {
      var active = ms.state === "active";
      var card = el("div", {
        class: "mcard " + (active ? "is-active" : "is-locked")
      });

      var statusCls = ms.badge === "mvp" ? "mvp" : (active ? "active" : "locked");
      var statusTxt = ms.badge === "mvp" ? "MVP" : (active ? "In progress" : "Locked");

      card.appendChild(el("div", { class: "mcard-head" }, [
        el("div", { class: "mcard-code", text: ms.code }),
        el("div", { class: "mcard-info" }, [
          el("h3", { text: ms.title }),
          el("p", { text: ms.blurb })
        ]),
        el("div", { class: "mcard-status " + statusCls, text: statusTxt })
      ]));

      var body = el("div", { class: "mcard-concepts" });
      if (ms.concepts.length === 0) {
        body.appendChild(el("div", {
          class: "concept-empty",
          text: active
            ? "First concept being written."
            : "Unlocks once the milestone before it is built."
        }));
      } else {
        ms.concepts.forEach(function (c) {
          if (c.state === "locked") {
            body.appendChild(el("div", { class: "concept-row locked" }, [
              el("span", { class: "cr-idx", text: c.code }),
              el("span", {}, [
                el("div", { class: "cr-title", text: c.title }),
                c.sub ? el("div", { class: "cr-sub", text: c.sub }) : null
              ]),
              el("span", { class: "cr-go", text: "🔒" })
            ]));
            return;
          }
          var done = Progress.isComplete(c.id);
          body.appendChild(el("a", { class: "concept-row", href: c.file }, [
            el("span", { class: "cr-idx", text: c.code }),
            el("span", {}, [
              el("div", { class: "cr-title", text: c.title }),
              c.sub ? el("div", { class: "cr-sub", text: c.sub }) : null
            ]),
            done
              ? el("span", { class: "cr-check", text: "✓ done" })
              : el("span", { class: "cr-go", text: "Open →" })
          ]));
        });
      }
      card.appendChild(body);
      host.appendChild(card);
    });
  }

  /* ============================================================
     Copy buttons on code blocks
     ============================================================ */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); resolve(); }
      catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }
  function initCopyButtons() {
    document.querySelectorAll(".code").forEach(function (block) {
      var btn = block.querySelector(".copy-btn");
      var codeEl = block.querySelector("code") || block.querySelector("pre");
      if (!btn || !codeEl) return;
      btn.addEventListener("click", function () {
        copyText(codeEl.innerText).then(function () {
          var old = btn.textContent;
          btn.textContent = "Copied ✓";
          btn.classList.add("copied");
          setTimeout(function () {
            btn.textContent = old;
            btn.classList.remove("copied");
          }, 1500);
        });
      });
    });
  }

  /* ============================================================
     Mobile navigation drawer
     ============================================================ */
  function initMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var overlay = document.getElementById("nav-overlay");
    if (!toggle) return;
    function close() { document.body.classList.remove("nav-open"); }
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    if (overlay) overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ============================================================
     "On this page" built from the article's <h2 id> elements
     ============================================================ */
  function initToc() {
    var host = document.getElementById("on-this-page");
    if (!host) return;
    var heads = document.querySelectorAll(".article h2[id]");
    if (!heads.length) { host.style.display = "none"; return; }

    var list = el("ol");
    var links = [];
    heads.forEach(function (h) {
      var label = h.getAttribute("data-toc") || h.textContent;
      var a = el("a", { href: "#" + h.id, text: label });
      links.push({ a: a, id: h.id });
      list.appendChild(el("li", {}, a));
    });
    host.appendChild(el("h4", { text: "On this page" }));
    host.appendChild(list);

    if ("IntersectionObserver" in window) {
      var seen = {};
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
        var activeId = null;
        for (var i = 0; i < heads.length; i++) {
          if (seen[heads[i].id]) { activeId = heads[i].id; break; }
        }
        links.forEach(function (l) {
          l.a.classList.toggle("active", l.id === activeId);
        });
      }, { rootMargin: "0px 0px -70% 0px" });
      heads.forEach(function (h) { obs.observe(h); });
    }
  }

  /* ============================================================
     Reflect saved progress into any [data-progress-of] element
     ============================================================ */
  function reflectProgress() {
    document.querySelectorAll("[data-progress-of]").forEach(function (node) {
      var id = node.getAttribute("data-progress-of");
      if (Progress.isComplete(id)) {
        node.textContent = node.getAttribute("data-done-text") || "✓ Done";
        node.classList.add("is-done");
      }
    });
  }

  /* ---- boot ------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderSidebar();
    renderCurriculumMap();
    initCopyButtons();
    initMobileNav();
    initToc();
    reflectProgress();
  });
})();
