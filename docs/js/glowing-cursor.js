/**
 * Mouse-following gold radial gradient glow.
 * Ported from polyhammer.com frontend (glowing-cursor.tsx).
 * Hidden on screens narrower than 768px.
 */
(function () {
  // Don't run on mobile / narrow screens
  if (window.innerWidth < 768) return;

  var glow = document.createElement("div");
  glow.id = "cursor-glow";
  glow.style.cssText = [
    "position: fixed",
    "top: -16rem",
    "left: -16rem",
    "width: 32rem",
    "height: 32rem",
    "border-radius: 50%",
    "pointer-events: none",
    "z-index: -10",
    "background: radial-gradient(circle, rgba(213,144,0,0.08) 0%, rgba(255,255,255,0) 70%)",
    "will-change: transform",
    "transition: opacity 0.3s ease-out",
    "opacity: 0",
  ].join(";");

  document.body.appendChild(glow);

  // Fade in once appended
  requestAnimationFrame(function () {
    glow.style.opacity = "1";
  });

  window.addEventListener(
    "mousemove",
    function (e) {
      glow.style.transform =
        "translate3d(" + e.clientX + "px, " + e.clientY + "px, 0)";
    },
    { passive: true }
  );
})();
