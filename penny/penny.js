/* ============================================================
   PENNY — interactions
   - scroll parallax for 3D objects (drift up at varied speeds)
   - reveal-on-scroll
   - interactive AI chat demo
   - nav scroll state
   - tweaks sync (CSS vars + data attrs)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Parallax scene ---------- */
  var floaties = Array.prototype.slice.call(document.querySelectorAll(".floaty"));
  var ticking = false;

  function applyParallax() {
    var y = window.scrollY || window.pageYOffset;
    for (var i = 0; i < floaties.length; i++) {
      var el = floaties[i];
      var speed = parseFloat(el.getAttribute("data-speed")) || 0;
      var spin = parseFloat(el.getAttribute("data-spin")) || 0;
      // positive speed => drifts upward as you scroll down
      var ty = -y * speed;
      var rz = y * spin * 0.012;
      el.style.transform = "translate3d(0," + ty.toFixed(1) + "px,0) rotate(" + rz.toFixed(2) + "deg)";
    }
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { window.requestAnimationFrame(applyParallax); ticking = true; }
    // nav state
    var nav = document.querySelector(".nav-inner");
    if (nav) nav.classList.toggle("scrolled", (window.scrollY || 0) > 30);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  applyParallax();
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("in"); });
  }

  /* ---------- AI chat demo ---------- */
  var chat = document.getElementById("chat");
  var promptWrap = document.getElementById("prompts");
  var busy = false;

  // scripted conversations keyed by prompt
  var CONVO = {
    spend: {
      penny: 'You spent <b>$1,840</b> this month — about <b>12% less</b> than May. Dining out dropped the most.',
      card: { label: "Dining", pct: 38, note: "$420 · down $90" }
    },
    save: {
      penny: 'If we move <b>$220/mo</b> to savings, you hit your <b>$5,000</b> cushion by October — 2 months early. Want me to automate it?',
      card: { label: "Goal progress", pct: 64, note: "$3,200 of $5,000" }
    },
    crypto: {
      penny: 'Your portfolio is <b>+4.2%</b> this week. Crypto is <b>18%</b> of net worth — a touch above your 15% target.',
      card: { label: "BTC + ETH", pct: 18, note: "$6,140 · rebalance?" }
    },
    bills: {
      penny: 'Heads up — <b>3 subscriptions</b> renew next week totaling <b>$47</b>. One looks unused since February. Cancel it?',
      card: { label: "Renewing soon", pct: 22, note: "Streaming · $15.99" }
    }
  };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function addBubble(node) {
    chat.appendChild(node);
    // trigger animation
    requestAnimationFrame(function () { node.classList.add("show"); });
    chat.scrollTop = chat.scrollHeight;
  }

  function ask(key, label) {
    if (busy || !CONVO[key]) return;
    busy = true;
    // disable chips
    promptWrap.querySelectorAll(".prompt-chip").forEach(function (c) { c.disabled = true; });

    var u = el("div", "bubble user", label);
    addBubble(u);

    setTimeout(function () {
      var typing = el("div", "typing");
      typing.innerHTML = "<span></span><span></span><span></span>";
      chat.appendChild(typing);
      chat.scrollTop = chat.scrollHeight;

      setTimeout(function () {
        chat.removeChild(typing);
        var c = CONVO[key];
        var html = c.penny;
        if (c.card) {
          html += '<div class="mini-card"><div style="font-size:12px;color:var(--muted);font-family:var(--font-mono);letter-spacing:.04em">' +
            c.card.label + '</div><div class="bar"><i style="width:' + c.card.pct + '%"></i></div>' +
            '<div style="font-size:12.5px;color:var(--ink-dim)">' + c.card.note + '</div></div>';
        }
        var b = el("div", "bubble penny", html);
        addBubble(b);
        busy = false;
        promptWrap.querySelectorAll(".prompt-chip").forEach(function (cc) {
          if (cc.getAttribute("data-asked") !== "1") cc.disabled = false;
        });
      }, 1100);
    }, 420);
  }

  if (promptWrap) {
    promptWrap.addEventListener("click", function (e) {
      var chip = e.target.closest(".prompt-chip");
      if (!chip || chip.disabled) return;
      chip.setAttribute("data-asked", "1");
      ask(chip.getAttribute("data-key"), chip.textContent.trim());
      chip.disabled = true;
    });
  }

  // seed the conversation with one exchange so the screen isn't empty
  function seed() {
    var greet = el("div", "bubble penny", "Hi — I'm <b>Penny</b>. Ask me anything about your money. 👇");
    chat.appendChild(greet); greet.classList.add("show");
  }
  if (chat) seed();

  /* ---------- email form ---------- */
  var forms = document.querySelectorAll(".email-form");
  forms.forEach(function (f) {
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var inp = f.querySelector("input");
      var btn = f.querySelector("button");
      if (inp && inp.value.indexOf("@") > 0) {
        btn.textContent = "You're on the list ✓";
        btn.disabled = true; inp.disabled = true;
      } else if (inp) {
        inp.focus(); inp.style.borderColor = "var(--accent)";
      }
    });
  });

  /* ---------- Tweaks sync (called by the React panel island) ---------- */
  window.applyPennyTweaks = function (t) {
    var root = document.documentElement;
    if (t.accent) {
      root.style.setProperty("--accent", t.accent);
      // derive soft + glow + deep from chosen accent
      root.style.setProperty("--accent-soft", hexA(t.accent, 0.14));
      root.style.setProperty("--accent-glow", hexA(t.accent, 0.40));
      root.style.setProperty("--accent-deep", shade(t.accent, -0.32));
    }
    if (t.bgTone) {
      var tones = {
        warm:    ["#0a0c0a", "#0e110c"],
        neutral: ["#0a0a0b", "#0e0e10"],
        cool:    ["#080b0d", "#0c1013"]
      };
      var bt = tones[t.bgTone] || tones.warm;
      root.style.setProperty("--bg", bt[0]);
      root.style.setProperty("--bg-warm", bt[1]);
    }
    if (t.density) root.setAttribute("data-density", t.density);
    if (typeof t.motion === "boolean") {
      document.body.style.setProperty("--bob-play", t.motion ? "running" : "paused");
      document.querySelectorAll(".floaty .bob").forEach(function (b) {
        b.style.animationPlayState = t.motion ? "running" : "paused";
      });
    }
    if (t.headline != null) {
      var h = document.getElementById("hero-accent");
      if (h) h.textContent = t.headline;
    }
  };

  function hexA(hex, a) {
    var c = parseHex(hex); if (!c) return hex;
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }
  function shade(hex, amt) {
    var c = parseHex(hex); if (!c) return hex;
    function ad(v) { return Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt)))); }
    return "rgb(" + ad(c[0]) + "," + ad(c[1]) + "," + ad(c[2]) + ")";
  }
  function parseHex(hex) {
    if (!hex) return null;
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(function (x) { return x + x; }).join("");
    if (hex.length !== 6) return null;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
})();
