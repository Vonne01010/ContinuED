/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F1F4B",
        blue: { DEFAULT: "#2563EB" },
        amber: { DEFAULT: "#F59E0B" },
        green: { DEFAULT: "#16A34A" },
        mist: "#EEF2F8",
        danger: "#EF4444",
      },
      fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
      boxShadow: { soft: "0 1px 2px rgba(15,31,75,.04), 0 6px 20px -8px rgba(15,31,75,.12)" },
    },
  },
  plugins: [],
};
