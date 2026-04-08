/**
 * tsParticles initialization — gold particle network background.
 * Ported from polyhammer.com frontend (particles.tsx).
 */
(async function () {
  if (typeof tsParticles === "undefined" || typeof loadSlim === "undefined") return;

  // Register slim plugins (shapes, interactors, etc.) before loading
  await loadSlim(tsParticles);

  await tsParticles.load({
    id: "tsparticles",
    options: {
      autoPlay: true,
      background: { color: { value: "" } },
      clear: true,
      fullScreen: { enable: true, zIndex: -30 },
      detectRetina: true,
      fpsLimit: 120,
      interactivity: {
        detectsOn: "window",
        events: {
          onClick: { enable: true, mode: "repulse" },
          onHover: {
            enable: true,
            mode: "slow",
            parallax: { enable: true, force: 15, smooth: 500 },
          },
          resize: { delay: 1, enable: true },
        },
        modes: {
          repulse: {
            distance: 200,
            duration: 1,
            factor: 100,
            speed: 1,
            maxSpeed: 20,
            easing: "ease-in-out-quad",
          },
          slow: { factor: 2, radius: 100 },
        },
      },
      particles: {
        color: { value: "#cba135" },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "out" },
          random: false,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: { enable: true, width: 1920, height: 1080 },
          value: 120,
        },
        opacity: {
          value: 0.5,
        },
        shape: { type: "circle" },
        size: {
          value: { min: 0, max: 0.1 },
        },
        links: {
          color: { value: "#cba135" },
          distance: 150,
          enable: true,
          frequency: 1,
          opacity: 0.4,
          width: 1,
          warp: false,
        },
      },
      pauseOnBlur: false,
      pauseOnOutsideViewport: false,
      smooth: false,
    },
  });

  // Fade the particles in — same duration as fade-out (300ms)
  // Theme determines final opacity: 0.4 in light, 1 in dark.
  // CSS keeps it at 0 until this runs, preventing any flash.
  var container = document.getElementById("tsparticles");
  if (container) {
    var isDark = document.documentElement.classList.contains('dark');
    var targetOpacity = isDark ? '1' : '0.4';
    container.animate(
      [{ opacity: '0' }, { opacity: targetOpacity }],
      { duration: 300, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' }
    ).onfinish = function () { container.style.opacity = targetOpacity; };
  }
})();

// Dip to black — fade particles + page content out on navigate, back in on load
(function () {
  var FADE_OUT_MS = 300;
  var FADE_IN_MS  = 300;
  var FADE_IN_DELAY_MS = 0;

  function animateTo(el, opacity, durationMs, delayMs) {
    if (!el) return;
    el.style.opacity = String(opacity === 0 ? 0 : 1); // snap after
    return el.animate(
      [{ opacity: el.style.opacity === '' ? getComputedStyle(el).opacity : el.style.opacity },
       { opacity: String(opacity) }],
      { duration: durationMs, delay: delayMs || 0, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' }
    );
  }

  // Fade the article and TOC in once the DOM is ready
  function fadeInArticle() {
    var article = document.querySelector("article[view-transition-name='page']");
    var toc     = document.getElementById('toc');
    if (!article) return;
    // Remove the blocking style injected by the head script (if present)
    var blocker = document.getElementById('ph-nav-block');
    if (blocker) blocker.remove();
    var fadeInOpts = { duration: FADE_IN_MS, delay: FADE_IN_DELAY_MS, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' };
    article.animate(
      [{ opacity: '0' }, { opacity: '1' }], fadeInOpts
    ).onfinish = function () { article.style.opacity = '1'; };
    if (toc) {
      toc.animate(
        [{ opacity: '0' }, { opacity: '1' }], fadeInOpts
      ).onfinish = function () { toc.style.opacity = '1'; };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fadeInArticle);
  } else {
    fadeInArticle();
  }

  // Intercept same-origin link clicks
  var fading = false;
  document.addEventListener('click', function (e) {
    if (fading) return;
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('javascript:') ||
      link.target === '_blank' ||
      link.origin !== window.location.origin
    ) return;

    e.preventDefault();
    fading = true;

    var particles = document.getElementById('tsparticles');
    var article   = document.querySelector("article[view-transition-name='page']");
    var toc       = document.getElementById('toc');

    // Signal the next page to start hidden
    sessionStorage.setItem('ph-navigating', '1');

    var done = 0;
    var needed = (particles ? 1 : 0) + (article ? 1 : 0) || 1;
    function onDone() {
      done++;
      if (done >= needed) window.location.href = link.href;
    }

    if (particles) {
      var a1 = particles.animate(
        [{ opacity: getComputedStyle(particles).opacity }, { opacity: '0' }],
        { duration: FADE_OUT_MS, easing: 'cubic-bezier(0.4,0,0.6,1)', fill: 'forwards' }
      );
      a1.onfinish = onDone;
    }
    if (article) {
      var a2 = article.animate(
        [{ opacity: getComputedStyle(article).opacity }, { opacity: '0' }],
        { duration: FADE_OUT_MS, easing: 'cubic-bezier(0.4,0,0.6,1)', fill: 'forwards' }
      );
      a2.onfinish = onDone;
    }
    if (toc) {
      toc.animate(
        [{ opacity: getComputedStyle(toc).opacity }, { opacity: '0' }],
        { duration: FADE_OUT_MS, easing: 'cubic-bezier(0.4,0,0.6,1)', fill: 'forwards' }
      );
    }
    if (!particles && !article) onDone();
  });
})();
