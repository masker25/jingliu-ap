/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          main: "#F8F6F1",
          soft: "#FCFAF6",
          deep: "#F3EFE7",
        },
        ink: {
          main: "#11100E",
          graphite: "#2D2A26",
          muted: "#7E786F",
          faint: "#B8B0A4",
          ghost: "#D8D1C4",
        },
        line: {
          soft: "#E4DDD2",
          faint: "#EFE8DD",
          hair: "#F2ECE0",
        },
        accent: {
          gold: "#B79A6B",
          dot: "#C8B18B",
          sand: "#E8DCC2",
          warn: "#A37148",
        },
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"HarmonyOS Sans SC"',
          '"Microsoft YaHei"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        serif: ['"Source Han Serif SC"', '"Songti SC"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', "Consolas", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        widest2: "0.32em",
      },
      transitionTimingFunction: {
        gentle: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
