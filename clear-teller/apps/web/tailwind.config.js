/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // calm, low-ambiguity palette; "faint" divergent nodes use the muted tones
        ink: "#1a1a1f",
        faint: "#9aa0aa",
      },
    },
  },
  plugins: [],
};
