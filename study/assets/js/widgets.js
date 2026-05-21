/* ============================================================
   CTF Platform — Study Site
   widgets.js  ·  the interactive teaching demos
   Each <div data-widget="NAME"> on a page gets wired up here.
   Pure vanilla JS, no dependencies, runs from file://.
   ============================================================ */
(function () {
  "use strict";

  /* ---- helpers --------------------------------------------- */
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

  function reduced() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* Build the standard widget chrome; returns the body element. */
  function shell(root) {
    root.classList.add("widget");
    var kicker = root.getAttribute("data-kicker") || "Interactive";
    var title = root.getAttribute("data-title") || "";
    var head = el("div", { class: "widget-head" }, [
      el("span", { class: "w-kicker", text: kicker }),
      title ? el("span", { class: "w-title", text: title }) : null
    ]);
    root.innerHTML = "";
    root.appendChild(head);
    var body = el("div", { class: "widget-body" });
    root.appendChild(body);
    return body;
  }

  function note(root, text) {
    root.appendChild(el("div", { class: "widget-note", text: text }));
  }

  /* Run a list of {do, wait} steps in sequence. */
  function runSteps(steps, i) {
    i = i || 0;
    if (i >= steps.length) return;
    var s = steps[i];
    if (s.do) s.do();
    setTimeout(function () { runSteps(steps, i + 1); }, s.wait || 0);
  }

  /* ============================================================
     WIDGET — Request / response round-trip animator
     ============================================================ */
  function initRoundtrip(root) {
    var body = shell(root);
    var slow = !reduced();

    var ROUTES = {
      "GET /":      { path: "/",      status: 200, mini: "200 · welcome page" },
      "GET /about": { path: "/about", status: 200, mini: "200 · about page" },
      "GET /nope":  { path: "/nope",  status: 404, mini: "404 · not found" }
    };

    function makeNode(ico, name, sub, screenText) {
      var screen = el("div", { class: "rr-screen", text: screenText });
      var box = el("div", { class: "rr-node" }, [
        el("div", { class: "rr-ico", text: ico }),
        el("div", { class: "rr-name", text: name }),
        el("div", { class: "rr-sub", text: sub }),
        screen
      ]);
      return { box: box, screen: screen };
    }

    var browser = makeNode("🖥️", "Browser", "you", "idle");
    var server = makeNode("⚙️", "Dev server", "php artisan serve", "listening :8000");
    var wire = el("div", { class: "rr-wire" });
    var packet = el("div", { class: "rr-packet" });
    var stage = el("div", { class: "rr-stage" },
      [wire, browser.box, packet, server.box]);

    var log = el("ol", { class: "rr-log" });

    var select = el("select", { class: "input" });
    Object.keys(ROUTES).forEach(function (r) {
      select.appendChild(el("option", { value: r, text: r }));
    });
    var sendBtn = el("button", { class: "btn btn--primary", text: "▶  Send request" });

    body.appendChild(stage);
    body.appendChild(el("div", { class: "controls" }, [
      el("span", { style: "color:var(--text-faint);font-size:13px", text: "Request:" }),
      select, sendBtn
    ]));
    body.appendChild(log);
    note(root, "Pick a request and watch the full round-trip. Try GET /nope — " +
      "there is no route for that path, so Laravel answers 404.");

    function logLine(spanCls, prefix, text) {
      var li = el("li", {}, [
        el("span", { class: spanCls, text: prefix }),
        " " + text
      ]);
      log.appendChild(li);
      requestAnimationFrame(function () { li.classList.add("in"); });
      log.scrollTop = log.scrollHeight;
    }

    function packetAt(pct) {
      packet.style.transition = "none";
      packet.style.left = pct;
      void packet.offsetWidth;          /* force reflow before re-enabling */
      packet.style.transition = "";
    }

    function reset() {
      log.innerHTML = "";
      packet.className = "rr-packet";
      packetAt("13%");
      browser.box.classList.remove("active");
      server.box.classList.remove("active");
      browser.screen.innerHTML = "loading…";
      server.screen.textContent = "listening :8000";
    }

    function send() {
      var r = ROUTES[select.value];
      var ok = r.status === 200;
      sendBtn.disabled = true;
      select.disabled = true;
      reset();

      runSteps([
        { do: function () {
            logLine("t-sys", "·", "Browser opens a TCP connection to 127.0.0.1:8000");
          }, wait: slow ? 650 : 120 },

        { do: function () {
            packet.className = "rr-packet req";
            packet.textContent = select.value;
            requestAnimationFrame(function () {
              packet.classList.add("show");
              packet.style.left = "87%";
            });
          }, wait: slow ? 1050 : 140 },

        { do: function () {
            server.box.classList.add("active");
            server.screen.textContent = "routing…";
            logLine("t-in", "→", "Server received:  " + select.value + " HTTP/1.1");
          }, wait: slow ? 800 : 120 },

        { do: function () {
            logLine("t-in", "→", "Laravel: looking for a route that matches  " + r.path);
          }, wait: slow ? 850 : 120 },

        { do: function () {
            if (ok) {
              logLine("t-in", "→", "Laravel: route matched — building the response");
              server.screen.textContent = "built ✓";
            } else {
              logLine("t-err", "→", "Laravel: NO route matches  " + r.path);
              server.screen.textContent = "no match";
            }
          }, wait: slow ? 750 : 120 },

        { do: function () {
            packet.className = "rr-packet show " + (ok ? "res" : "err");
            packet.textContent = ok ? "200 OK" : "404 Not Found";
            packet.style.left = "13%";
            server.box.classList.remove("active");
          }, wait: slow ? 1050 : 140 },

        { do: function () {
            browser.box.classList.add("active");
            packet.classList.remove("show");
            if (ok) {
              browser.screen.innerHTML =
                '<span class="mini-200">' + r.mini + "</span>";
              logLine("t-out", "←", "200 OK   ·   Content-Type: text/html");
              logLine("t-out", "←", "body:  <!doctype html> … the page HTML …");
              logLine("t-sys", "✓", "Browser parses the HTML and paints the page");
            } else {
              browser.screen.innerHTML =
                '<span class="mini-404">' + r.mini + "</span>";
              logLine("t-out", "←", "404 Not Found   ·   Content-Type: text/html");
              logLine("t-sys", "✓", "Browser shows Laravel's 404 page");
            }
            sendBtn.disabled = false;
            select.disabled = false;
          }, wait: 0 }
      ]);
    }

    sendBtn.addEventListener("click", send);
    reset();
    browser.screen.textContent = "idle — press Send";
  }

  /* ============================================================
     WIDGET — "Is it alive?" liveness demo
     ============================================================ */
  function initLiveness(root) {
    var body = shell(root);

    var running = true;
    var screen = "idle";   /* idle | page | error */

    /* server panel */
    var dotCore = el("div", { class: "core" });
    var serverFace = el("div", { class: "server-face up" }, [
      el("div", { class: "server-dot" }, dotCore),
      el("div", { class: "server-state", text: "RUNNING" }),
      el("div", { class: "server-port", text: "listening on 127.0.0.1:8000" }),
      el("div", { class: "server-pid", text: "php  ·  pid 47218" })
    ]);
    var serverBox = el("div", { class: "live-box" }, [
      el("h4", { text: "The dev server" }), serverFace
    ]);

    /* browser panel */
    var mbScreen = el("div", { class: "mb-screen" });
    var browserBox = el("div", { class: "live-box" }, [
      el("h4", { text: "Your browser" }),
      el("div", { class: "mini-browser" }, [
        el("div", { class: "mb-chrome" }, [
          el("div", { class: "mb-dots" },
            [el("i"), el("i"), el("i")]),
          el("div", { class: "mb-url", text: "127.0.0.1:8000" })
        ]),
        mbScreen
      ])
    ]);

    body.appendChild(el("div", { class: "live-grid" }, [serverBox, browserBox]));

    var serverBtn = el("button", { class: "btn btn--danger", text: "■  Stop server (Ctrl+C)" });
    var reloadBtn = el("button", { class: "btn", text: "⟳  Reload the page" });
    body.appendChild(el("div", { class: "controls", style: "margin-top:16px" },
      [serverBtn, reloadBtn]));

    var log = el("ol", { class: "rr-log", style: "margin-top:16px" });
    body.appendChild(log);
    note(root, "Key move: stop the server, then look at the browser — the page is " +
      "STILL there. It's a stale snapshot. Only when you reload do you discover " +
      "the server is gone.");

    function logLine(cls, prefix, text) {
      var li = el("li", {}, [el("span", { class: cls, text: prefix }), " " + text]);
      log.appendChild(li);
      requestAnimationFrame(function () { li.classList.add("in"); });
      log.scrollTop = log.scrollHeight;
    }

    function renderServer() {
      serverFace.classList.toggle("up", running);
      serverFace.querySelector(".server-state").textContent =
        running ? "RUNNING" : "STOPPED";
      serverFace.querySelector(".server-port").textContent =
        running ? "listening on 127.0.0.1:8000" : "not listening — port 8000 free";
      serverFace.querySelector(".server-pid").textContent =
        running ? "php  ·  pid 47218" : "php  ·  pid —  (process killed)";
      serverBtn.textContent = running ? "■  Stop server (Ctrl+C)" : "▶  Start server";
      serverBtn.className = running ? "btn btn--danger" : "btn btn--primary";
    }

    function renderScreen() {
      var scr;
      if (screen === "page") {
        scr = el("div", { class: "scr scr-page" }, [
          el("div", { class: "lv-logo", text: "Laravel" }),
          el("div", { class: "lv-sub", text: "Welcome — your app is running." }),
          el("div", { class: "lv-bar" }),
          el("div", { class: "lv-bar", style: "width:42%" })
        ]);
      } else if (screen === "error") {
        scr = el("div", { class: "scr scr-error" }, [
          el("div", { class: "err-ico", text: "⚠" }),
          el("div", { class: "err-title", text: "This site can't be reached" }),
          el("div", { class: "err-msg", text: "127.0.0.1 refused to connect." }),
          el("div", { class: "err-code", text: "ERR_CONNECTION_REFUSED" })
        ]);
      } else {
        scr = el("div", { class: "scr scr-idle" },
          el("div", { text: "Nothing loaded yet — press “Reload the page”." }));
      }
      mbScreen.innerHTML = "";
      mbScreen.appendChild(scr);
    }

    serverBtn.addEventListener("click", function () {
      running = !running;
      if (running) {
        logLine("t-out", "▶", "php artisan serve  —  process bound to port 8000.");
      } else {
        logLine("t-err", "■", "Ctrl+C  —  the PHP process is killed.");
        logLine("t-sys", "·", "Note: the page already on screen did NOT change. " +
          "It's a stale snapshot from the last response.");
      }
      renderServer();
    });

    reloadBtn.addEventListener("click", function () {
      if (running) {
        screen = "page";
        logLine("t-in", "→", "GET /  ·  sent to 127.0.0.1:8000");
        logLine("t-out", "←", "200 OK  —  server generated the HTML, browser painted it.");
      } else {
        screen = "error";
        logLine("t-in", "→", "GET /  ·  trying 127.0.0.1:8000 …");
        logLine("t-err", "✗", "Connection refused — nothing is listening on port 8000.");
      }
      renderScreen();
    });

    renderServer();
    renderScreen();
  }

  /* ============================================================
     WIDGET — Terminal sandbox
     ============================================================ */
  function initTerminal(root) {
    var body = shell(root);

    var BUILDER = "C:\\Users\\alexg\\studying_for_hack_the_box\\builder";
    var cwd = BUILDER;
    var appCreated = false;
    var busy = false;

    var termBody = el("div", { class: "term-body" });
    var input = el("input", {
      class: "term-input", type: "text", spellcheck: "false",
      autocomplete: "off", "aria-label": "terminal input"
    });
    var promptSpan = el("span", { class: "t-prompt" });
    var pathSpan = el("span", { class: "t-path" });
    var inputLine = el("div", { class: "term-input-line" }, [
      promptSpan, pathSpan, el("span", { class: "t-prompt", text: "> " }), input
    ]);

    var term = el("div", { class: "term" }, [
      el("div", { class: "term-bar" }, [
        el("div", { class: "term-lights" }, [el("i"), el("i"), el("i")]),
        el("div", { class: "term-title", text: "Windows PowerShell — practice sandbox" })
      ]),
      termBody
    ]);
    termBody.appendChild(inputLine);
    body.appendChild(term);

    var CHIPS = ["php --version", "composer --version", "laravel --version",
      "cd backend", "php artisan serve", "help", "clear"];
    var chipRow = el("div", { class: "term-chips" });
    CHIPS.forEach(function (c) {
      chipRow.appendChild(el("span", {
        class: "chip", text: c,
        onclick: function () { if (!busy) exec(c); }
      }));
    });
    body.appendChild(chipRow);
    note(root, "A safe sandbox — nothing here touches your real machine. It mimics " +
      "what you'll actually see when you do the checkpoint for real.");

    function refreshPrompt() {
      promptSpan.textContent = "PS ";
      pathSpan.textContent = cwd;
    }

    function put(node) { termBody.insertBefore(node, inputLine); }

    function echo(cmd) {
      put(el("div", { class: "term-line" }, [
        el("span", { class: "t-prompt", text: "PS " }),
        el("span", { class: "t-path", text: cwd }),
        el("span", { class: "t-prompt", text: "> " }),
        el("span", { class: "t-cmd", text: cmd })
      ]));
    }

    function out(text, cls) {
      put(el("div", { class: "term-out" + (cls ? " " + cls : ""), text: text }));
    }

    function scroll() { termBody.scrollTop = termBody.scrollHeight; }

    function startServer() {
      out("");
      out("   INFO  Server running on [http://127.0.0.1:8000].", "info");
      out("");
      out("   Press Ctrl+C to stop the server.");
      out("");
      busy = true;
      inputLine.style.display = "none";
      var stopBtn = el("button", {
        class: "btn btn--danger btn--sm", text: "■  Stop (Ctrl+C)"
      });
      var busyLine = el("div", { class: "term-busy" }, [
        el("span", { class: "term-cursor" }),
        el("span", { text: "dev server running — this terminal is now busy" }),
        stopBtn
      ]);
      put(busyLine);
      stopBtn.addEventListener("click", function () {
        termBody.removeChild(busyLine);
        out("^C");
        out("Server stopped. The terminal is free again.", "ok");
        busy = false;
        inputLine.style.display = "";
        input.focus();
        scroll();
      });
      scroll();
    }

    function exec(raw) {
      var cmd = (raw || "").trim();
      echo(cmd);
      var c = cmd.toLowerCase().replace(/\s+/g, " ");

      if (c === "") { /* nothing */ }

      else if (c === "clear" || c === "cls") {
        var lines = termBody.querySelectorAll(".term-line, .term-out, .term-busy");
        for (var i = 0; i < lines.length; i++) termBody.removeChild(lines[i]);
      }

      else if (c === "help") {
        out("Commands this sandbox understands:", "info");
        out("  php --version        composer --version     laravel --version");
        out("  laravel new backend  cd backend / cd ..     ls");
        out("  php artisan serve    clear");
      }

      else if (c === "php --version" || c === "php -v") {
        out("PHP 8.4.3 (cli) (built: Jan 11 2026 09:42:17) (NTS Visual C++ 2022 x64)");
        out("Copyright (c) The PHP Group");
        out("Zend Engine v4.4.3, Copyright (c) Zend Technologies");
      }

      else if (c === "composer --version" || c === "composer -v") {
        out("Composer version 2.8.6 2026-01-08 13:30:11");
      }

      else if (c === "laravel --version" || c === "laravel -v") {
        out("Laravel Installer 5.12.1");
      }

      else if (c === "laravel new backend") {
        out("   Creating a \"laravel/laravel\" project at \"./backend\"", "info");
        out("");
        out("   [ the real installer now asks a few questions: starter kit,");
        out("     test framework, database — see the section above for picks ]");
        out("");
        out("   INFO  Application ready in [backend]. Run \"php artisan serve\".", "ok");
        appCreated = true;
      }

      else if (c === "cd backend") {
        if (cwd.toLowerCase().indexOf("backend") !== -1) {
          out("You're already inside the backend folder.");
        } else if (!appCreated) {
          out("cd : Cannot find path '" + BUILDER +
            "\\backend' because it does not exist.", "err");
          out("    (Run  laravel new backend  first.)", "err");
        } else {
          cwd = BUILDER + "\\backend";
          refreshPrompt();
        }
      }

      else if (c === "cd .." || c === "cd ../") {
        if (cwd !== BUILDER) { cwd = BUILDER; refreshPrompt(); }
        else out("    (Staying in the builder folder for this sandbox.)");
      }

      else if (c === "ls" || c === "dir" || c === "gci") {
        if (cwd.toLowerCase().indexOf("backend") !== -1) {
          out("app   bootstrap   config   database   public   routes");
          out("storage   tests   vendor   artisan   composer.json   .env");
        } else if (appCreated) {
          out("backend");
        } else {
          out("    Directory is empty.");
        }
      }

      else if (c === "php artisan serve") {
        if (cwd.toLowerCase().indexOf("backend") === -1) {
          out("Could not open input file: artisan", "err");
          out("    (artisan only exists INSIDE the app — run  cd backend  first.)", "err");
        } else {
          startServer();
          refreshPrompt();
          return;
        }
      }

      else if (c === "php artisan") {
        out("Laravel Framework 12.20.0", "info");
        out("    (Try  php artisan serve  to start the dev server.)");
      }

      else {
        var prog = cmd.split(" ")[0];
        out(prog + " : The term '" + prog + "' is not recognized as the name of a", "err");
        out("cmdlet, function, script file, or operable program. Check the spelling.", "err");
      }

      refreshPrompt();
      scroll();
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var v = input.value;
        input.value = "";
        exec(v);
      }
    });
    term.addEventListener("click", function (e) {
      if (!busy && e.target.tagName !== "BUTTON") input.focus();
    });

    refreshPrompt();
    out("# Practice terminal. Click a command chip below, or type and press Enter.", "info");
    out("# Try:  php --version", "info");
  }

  /* ============================================================
     WIDGET — URL anatomy
     ============================================================ */
  function initUrlAnatomy(root) {
    var body = shell(root);

    var EXPLAIN = {
      scheme: { key: "http://  — the scheme",
        body: "The protocol: how the browser and server agree to talk. Plain HTTP " +
              "here. HTTPS is the same thing wrapped in encryption." },
      host: { key: "127.0.0.1  — the host",
        body: "Which machine to reach. 127.0.0.1 is the loopback address — your " +
              "computer talking to itself. Nothing leaves your machine." },
      port: { key: "8000  — the port",
        body: "Which listening process on that machine. php artisan serve binds " +
              "port 8000 by default. One port has exactly one listener." },
      path: { key: "/users/42  — the path",
        body: "What you're actually asking for. Laravel matches this path against " +
              "its list of routes to decide which of your code runs." }
    };

    var parts = [
      { t: "http://",    k: "scheme" },
      { t: "127.0.0.1",  k: "host" },
      { t: ":",          k: null },
      { t: "8000",       k: "port" },
      { t: "/users/42",  k: "path" }
    ];

    var line = el("div", { class: "url-line" });
    var explain = el("div", { class: "url-explain" }, [
      el("div", { class: "ue-key", text: "The address bar, dissected" }),
      el("div", { class: "ue-body",
        text: "Hover or tap any coloured part of the URL above." })
    ]);

    var spans = [];
    parts.forEach(function (p) {
      if (!p.k) { line.appendChild(document.createTextNode(p.t)); return; }
      var sp = el("span", {
        class: "url-part", "data-k": p.k, tabindex: "0", text: p.t
      });
      function activate() {
        spans.forEach(function (s) { s.classList.remove("active"); });
        sp.classList.add("active");
        var info = EXPLAIN[p.k];
        explain.innerHTML = "";
        explain.appendChild(el("div", { class: "ue-key", text: info.key }));
        explain.appendChild(el("div", { class: "ue-body", text: info.body }));
      }
      sp.addEventListener("mouseenter", activate);
      sp.addEventListener("focus", activate);
      sp.addEventListener("click", activate);
      spans.push(sp);
      line.appendChild(sp);
    });

    body.appendChild(el("div", { class: "url-anatomy" }, [line]));
    body.appendChild(explain);
  }

  /* ============================================================
     WIDGET — function call vs HTTP request analogy
     ============================================================ */
  function initAnalogy(root) {
    var body = shell(root);

    function part(pair, text) {
      return el("span", { class: "an-part", "data-pair": pair, text: text });
    }

    var leftCode = el("div", { class: "analogy-code" }, [
      part("ret", "var user ="), " ",
      part("name", "getUser"), "(", part("arg", "42"), ");"
    ]);
    var rightCode = el("div", { class: "analogy-code" }, [
      part("name", "GET"), " ", part("arg", "/users/42")
    ]);
    var rightRet = el("div", {
      style: "margin-top:8px;color:var(--text-faint);font-size:13.5px;font-family:var(--mono)"
    }, ["↳ ", part("ret", "200 OK  +  response body")]);

    body.appendChild(el("div", { class: "analogy-grid" }, [
      el("div", { class: "analogy-col" }, [
        el("h4", { text: "A function call" }), leftCode
      ]),
      el("div", { class: "analogy-col" }, [
        el("h4", { text: "An HTTP request" }), rightCode, rightRet
      ])
    ]));

    body.appendChild(el("div", { class: "analogy-legend" }, [
      el("span", {}, [el("b", { text: "Function name " }), "↔ HTTP method — the operation"]),
      el("span", {}, [el("b", { text: "Argument " }), "↔ URL path — what you're asking for"]),
      el("span", {}, [el("b", { text: "Return value " }), "↔ HTTP response — status + body"])
    ]));

    var all = root.querySelectorAll(".an-part");
    function lit(pair, on) {
      all.forEach(function (p) {
        if (p.getAttribute("data-pair") === pair) p.classList.toggle("lit", on);
      });
    }
    all.forEach(function (p) {
      var pair = p.getAttribute("data-pair");
      p.addEventListener("mouseenter", function () { lit(pair, true); });
      p.addEventListener("mouseleave", function () { lit(pair, false); });
    });

    note(root, "Hover a coloured chunk — its counterpart lights up in the other column. " +
      "A request really is just a function call sent over a network.");
  }

  /* ============================================================
     WIDGET — Quiz (reads questions from an inline JSON script)
     ============================================================ */
  function initQuiz(root) {
    var dataEl = root.querySelector('script[type="application/json"]');
    var data = { questions: [] };
    try { data = JSON.parse(dataEl.textContent); } catch (e) {}
    var qs = data.questions || [];

    var body = shell(root);
    var answered = 0, correct = 0;
    var score = el("div", { class: "quiz-score" });
    score.style.display = "none";

    qs.forEach(function (q, qi) {
      var qEl = el("div", { class: "quiz-q" });
      var done = false;
      qEl.appendChild(el("div", { class: "quiz-qhead" }, [
        el("span", { class: "quiz-num", text: "Q" + (qi + 1) }),
        el("span", { class: "quiz-text", text: q.q })
      ]));

      var explain = el("div", { class: "quiz-explain" });
      explain.style.display = "none";
      var opts = el("div", { class: "quiz-opts" });
      var btns = [];

      q.options.forEach(function (optText, oi) {
        var b = el("button", { class: "quiz-opt" }, [
          el("span", { class: "opt-key", text: String.fromCharCode(65 + oi) }),
          el("span", { text: optText })
        ]);
        b.addEventListener("click", function () {
          if (done) return;
          done = true;
          answered++;
          var right = oi === q.answer;
          if (right) correct++;
          btns.forEach(function (bb, bi) {
            bb.disabled = true;
            if (bi === q.answer) bb.classList.add("correct");
          });
          if (!right) b.classList.add("wrong");

          explain.innerHTML = "";
          explain.appendChild(el("b", { text: right ? "Correct. " : "Not quite. " }));
          explain.appendChild(document.createTextNode(q.why));
          explain.style.display = "block";

          if (answered === qs.length) {
            score.innerHTML = "";
            score.appendChild(document.createTextNode("You got "));
            score.appendChild(el("b", { text: correct + " / " + qs.length }));
            score.appendChild(document.createTextNode(
              correct === qs.length
                ? "  — you've got the mental model."
                : "  — worth re-reading the section, then re-try."));
            score.style.display = "block";
          }
        });
        btns.push(b);
        opts.appendChild(b);
      });

      qEl.appendChild(opts);
      qEl.appendChild(explain);
      body.appendChild(qEl);
    });

    body.appendChild(score);
  }

  /* ============================================================
     WIDGET — Checkpoint checklist (persists to localStorage)
     ============================================================ */
  function initChecklist(root) {
    var dataEl = root.querySelector('script[type="application/json"]');
    var items = [];
    try { items = (JSON.parse(dataEl.textContent).items) || []; } catch (e) {}
    var pid = root.getAttribute("data-progress-id") || "unknown";

    var store = window.StudyProgress;
    var body = shell(root);

    var saved = store ? store.get(pid) : {};
    var state = (saved.steps && saved.steps.length === items.length)
      ? saved.steps.slice()
      : items.map(function () { return false; });

    var ul = el("ul", { class: "checklist" });
    var rows = [];

    items.forEach(function (html, i) {
      var cb = el("input", { type: "checkbox" });
      var boxEl = el("span", { class: "check-box", text: "✓" });
      var label = el("label", { class: "check-item" }, [
        cb, boxEl, el("span", { class: "check-text", html: html })
      ]);
      ul.appendChild(el("li", {}, label));
      rows.push({ label: label, cb: cb });
      cb.addEventListener("change", function () {
        state[i] = cb.checked;
        apply();
        save();
      });
    });

    var banner = el("div", { class: "check-done-banner" }, [
      el("div", { class: "cdb-title", text: "✓  Checkpoint complete" }),
      el("div", { class: "cdb-sub",
        text: "Go tell Claude it runs. Next concept: writing your own route — your first real PHP." })
    ]);

    body.appendChild(ul);
    body.appendChild(banner);

    function apply() {
      var all = items.length > 0;
      rows.forEach(function (r, i) {
        r.cb.checked = state[i];
        r.label.classList.toggle("done", state[i]);
        if (!state[i]) all = false;
      });
      banner.classList.toggle("show", all);
    }
    function save() {
      if (!store) return;
      var all = items.length > 0 && state.every(function (x) { return x; });
      store.set(pid, { steps: state, __complete: all });
    }

    apply();
  }

  /* ---- dispatch -------------------------------------------- */
  var WIDGETS = {
    "roundtrip":   initRoundtrip,
    "liveness":    initLiveness,
    "terminal":    initTerminal,
    "url-anatomy": initUrlAnatomy,
    "analogy":     initAnalogy,
    "quiz":        initQuiz,
    "checklist":   initChecklist
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-widget]").forEach(function (node) {
      var name = node.getAttribute("data-widget");
      var fn = WIDGETS[name];
      if (!fn) return;
      try {
        fn(node);
      } catch (e) {
        console.error("[widget] '" + name + "' failed:", e);
        node.innerHTML =
          '<div class="widget-fallback">This interactive demo failed to load.</div>';
      }
    });
  });
})();
