export function AnalyticalTraceLayer() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="42%">
          <stop offset="0%" stopColor="#FCFAF6" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#F8F6F1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F8F6F1" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1000" height="700" fill="url(#centerGlow)" />

      <g
        stroke="#D8D1C4"
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.55"
      >
        <ellipse cx="500" cy="350" rx="200" ry="120" />
        <ellipse
          cx="500"
          cy="350"
          rx="280"
          ry="170"
          strokeDasharray="1.5 6"
          opacity="0.7"
        />
        <ellipse
          cx="500"
          cy="350"
          rx="360"
          ry="220"
          strokeDasharray="1 10"
          opacity="0.4"
        />
      </g>

      <g
        stroke="#B8B0A4"
        strokeWidth="0.6"
        opacity="0.45"
        strokeLinecap="round"
      >
        <path d="M 90 70 L 130 70" />
        <path d="M 130 70 L 130 110" />
        <path d="M 910 70 L 870 70" />
        <path d="M 870 70 L 870 110" />
        <path d="M 90 630 L 130 630" />
        <path d="M 130 630 L 130 590" />
        <path d="M 910 630 L 870 630" />
        <path d="M 870 630 L 870 590" />
      </g>

      <g
        fill="#7E786F"
        opacity="0.35"
        fontSize="7.5"
        fontFamily="ui-monospace, Consolas, monospace"
        letterSpacing="0.22em"
      >
        <text x="142" y="74">N · 01</text>
        <text x="816" y="74" textAnchor="end">N · 02</text>
        <text x="142" y="634">N · 03</text>
        <text x="816" y="634" textAnchor="end">N · 04</text>
      </g>

      <g
        stroke="#C8B18B"
        strokeWidth="0.5"
        opacity="0.55"
        strokeLinecap="round"
      >
        <path d="M 500 110 L 500 160" strokeDasharray="2 5" />
        <path d="M 500 540 L 500 590" strokeDasharray="2 5" />
      </g>

      <g fill="#B79A6B" opacity="0.7">
        <circle cx="500" cy="110" r="1.8" />
        <circle cx="500" cy="590" r="1.8" />
      </g>

      <g
        fill="#7E786F"
        opacity="0.32"
        fontSize="7"
        fontFamily="ui-monospace, Consolas, monospace"
        letterSpacing="0.32em"
      >
        <text x="500" y="100" textAnchor="middle">FOCAL · 01</text>
      </g>
    </svg>
  );
}
