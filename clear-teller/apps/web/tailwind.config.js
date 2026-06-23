/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Calm, near-monochrome paper with a single trustworthy accent.
        // Low ambiguity: every signal colour means exactly one thing.
        paper: "#fbfbf9", // canvas background
        surface: "#ffffff", // cards
        ink: "#1b1d22", // primary text
        "ink-soft": "#5b616b", // secondary text
        faint: "#aab0bb", // the "若隐若现" divergent content
        line: "#ebebe6", // hairlines
        accent: "#2563eb", // focus / interactive
        "accent-soft": "#eef4ff",
        ok: "#059669", // verified / checked
        "ok-soft": "#ecfdf5",
        warn: "#b45309", // conflict / needs attention
        "warn-soft": "#fff8ed",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        // mono carries the instrument-panel rigour of the checklist
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,29,34,0.04), 0 4px 16px rgba(27,29,34,0.06)",
        focal: "0 4px 12px rgba(27,29,34,0.06), 0 16px 48px rgba(27,29,34,0.10)",
      },
      letterSpacing: {
        label: "0.14em",
      },
    },
  },
  plugins: [],
};
