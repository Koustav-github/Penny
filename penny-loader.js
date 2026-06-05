/* ============================================================
   PENNY — loading sequence
   A single orb at center flips on its Y-axis, swapping glyph at
   each edge-on moment:  P → $ → P → ₹
   then shrinks + flies into the nav brand logo, revealing the page.
   ============================================================ */
(function () {
  "use strict";

  var loader = document.getElementById("penny-loader");
  if (!loader) return;

  var orb   = loader.querySelector(".loader-orb");
  var coin  = loader.querySelector(".lo-coin");
  var glyph = loader.querySelector(".lo-glyph");

  var SEQ = ["P", "$", "P", "₹"];   // glyphs shown, in order
  var ORB_SIZE = 156;
  var FLIP_MS = 720;
  var rot = 0;
  var finishing = false;

  function lockScroll(on) { document.body.style.overflow = on ? "hidden" : ""; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Keep the glyph upright: when the disc is on its "back" half-turn,
  // counter-rotate the glyph 180° so it always reads correctly.
  function dressGlyph(text) {
    glyph.textContent = text;
    glyph.style.transform = (Math.abs(rot % 360) === 180)
      ? "translateY(-2px) rotateY(180deg)"
      : "translateY(-2px)";
  }

  // Flip 180°, swapping to `nextText` at the hidden edge-on midpoint.
  function flipTo(nextText) {
    rot += 180;
    coin.style.transform = "rotateY(" + rot + "deg)";
    // hide the glyph momentarily and swap it while the disc is edge-on
    setTimeout(function () { glyph.style.opacity = "0"; }, FLIP_MS * 0.36);
    setTimeout(function () {
      dressGlyph(nextText);
      glyph.style.opacity = "1";
    }, FLIP_MS * 0.5);
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function finish() {
    if (finishing) return;
    finishing = true;

    var target = document.querySelector(".nav-inner .brand .coin-mark");
    var dx = 0, dy = 0, scale = 0.167;
    if (target) {
      var r = target.getBoundingClientRect();
      dx = (r.left + r.width / 2) - window.innerWidth / 2;
      dy = (r.top + r.height / 2) - window.innerHeight / 2;
      scale = r.width / ORB_SIZE;
    }

    // settle facing forward, showing "P" to match the nav logo
    if (Math.abs(rot % 360) !== 0) rot += 180;
    rot += 360;                                   // a final spin while travelling
    coin.style.transition = "transform 1s cubic-bezier(.62,.04,.3,1)";
    coin.style.transform = "rotateY(" + rot + "deg)";
    setTimeout(function () { dressGlyph("P"); glyph.style.opacity = "1"; }, 120);

    loader.classList.add("revealing");            // fade backdrop → page shows
    orb.style.transform =
      "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(" + scale + ")";

    setTimeout(function () {
      loader.classList.add("done");
      lockScroll(false);
      setTimeout(function () { loader.parentNode && loader.parentNode.removeChild(loader); }, 480);
    }, 1000);
  }

  async function run() {
    lockScroll(true);
    dressGlyph(SEQ[0]);                            // P

    if (reduce) { finish(); return; }

    await wait(640);                  if (finishing) return;
    flipTo(SEQ[1]);                                // → $
    await wait(1080);                 if (finishing) return;
    flipTo(SEQ[2]);                                // → P
    await wait(1080);                 if (finishing) return;
    flipTo(SEQ[3]);                                // → ₹
    await wait(1180);                 if (finishing) return;
    finish();                                      // shrink + fly into nav logo
  }

  loader.addEventListener("click", finish);        // tap to skip

  if (document.readyState === "complete") {
    requestAnimationFrame(run);
  } else {
    window.addEventListener("load", function () { requestAnimationFrame(run); });
  }
})();
