// Swap the header icon between light and dark variants based on the current theme.
// poly-hammer-icon.svg (black) for light theme, poly-hammer-icon-light.svg (white) for dark theme.
(function () {
    var LIGHT_ICON = "poly-hammer-icon.svg";
    var DARK_ICON = "poly-hammer-icon-light.svg";

    function updateIcon() {
        var isDark = document.documentElement.classList.contains("dark");
        var img = document.querySelector('header img[alt="icon"]');
        if (!img) return;
        // Preserve the directory prefix (e.g. "../assets/" on nested pages)
        var src = img.getAttribute("src");
        var base = src.substring(0, src.lastIndexOf("/") + 1);
        img.src = base + (isDark ? DARK_ICON : LIGHT_ICON);
    }

    // Run on load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", updateIcon);
    } else {
        updateIcon();
    }

    // Watch for theme changes (the .dark class toggles on <html>)
    new MutationObserver(updateIcon).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });
})();
