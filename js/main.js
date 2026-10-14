(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Theme ---------- */
  var themeBtn = document.getElementById("themeToggle");
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}

  setTheme(stored === "light" ? "light" : "dark");

  function setTheme(name) {
    if (name === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    if (themeBtn) {
      themeBtn.setAttribute("aria-label", name === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", name === "dark" ? "#0a0e16" : "#f4f6fa");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      setTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById("menuToggle");
  var nav = document.getElementById("nav");

  function closeMenu() {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
  }

  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Active nav link ---------- */
  var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          var link = map[entry.target.id];
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById("copyEmail");
  var copyStatus = document.getElementById("copyStatus");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email");
      function done(ok) {
        copyStatus.textContent = ok ? "Email copied: " + email : "Copy failed. My email is " + email;
        setTimeout(function () { copyStatus.textContent = ""; }, 3500);
      }
     function fallbackCopy() {
  var t = document.createElement("textarea");
  t.value = email;
  document.body.appendChild(t);
  t.select();
  var ok = false;
  try { ok = document.execCommand("copy"); } catch (e) {}
  t.remove();
  done(ok);
}

if (navigator.clipboard && navigator.clipboard.writeText) {
  navigator.clipboard.writeText(email).then(function () { done(true); }, fallbackCopy);
} else {
  fallbackCopy();
}
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Signal trace (hero) ---------- */
  var canvas = document.getElementById("signal");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var w = 0, h = 0, dpr = 1;
  var pointerX = -1, boost = 0, boostTarget = 0;
  var raf = null, visible = true;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function color(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function trace(t, freq, amp, phase, stroke, width) {
    ctx.beginPath();
    for (var x = 0; x <= w; x += 3) {
      var focus = pointerX < 0 ? 0 : Math.exp(-Math.pow((x - pointerX) / 140, 2));
      var a = amp * (1 + boost * focus * 1.6);
      var y = h / 2 + Math.sin(x * freq + t * 0.0012 + phase) * a
                    + Math.sin(x * freq * 2.3 + t * 0.0007) * a * 0.25;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    boost += (boostTarget - boost) * 0.08;
    trace(t, 0.012, h * 0.22, 1.7, color("--signal"), 2);
    trace(t, 0.009, h * 0.28, 0, color("--accent"), 2.5);
  }

  function loop(t) {
    draw(t);
    raf = visible ? requestAnimationFrame(loop) : null;
  }

  function start() {
    if (reduce || raf) return;
    raf = requestAnimationFrame(loop);
  }

  canvas.parentElement.addEventListener("pointermove", function (e) {
    var rect = canvas.getBoundingClientRect();
    pointerX = e.clientX - rect.left;
    boostTarget = 1;
  });
  canvas.parentElement.addEventListener("pointerleave", function () {
    boostTarget = 0;
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }

  window.addEventListener("resize", resize);
  if (themeBtn) themeBtn.addEventListener("click", function () { draw(performance.now()); });

  resize();
  start();
})();
