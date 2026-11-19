/** Decorative, server-rendered geometry: no canvas, client script, or agent content. */
export function HeaderPolygons() {
  return <div className="docs-header-art" aria-hidden="true">
    <svg viewBox="0 0 1000 320" preserveAspectRatio="xMidYMin slice" focusable="false">
      <g className="docs-polygon docs-polygon-left">
        <path d="M-30 24 92 8 166 81 91 164-24 122Z M-30 24 91 164 92 8 M-24 122 166 81-30 24" />
      </g>
      <g className="docs-polygon docs-polygon-middle">
        <path d="m391-28 108 22 61 91-116 46-76-67Z M391-28 444 131 499-6 M368 64 560 85" />
      </g>
      <g className="docs-polygon docs-polygon-right">
        <path d="m751-29 134 42 130 112-93 113-173-51-74-107Z M751-29 749 187 885 13 922 238 M675 80 1015 125 749 187 M885 13 675 80" />
      </g>
    </svg>
  </div>;
}
