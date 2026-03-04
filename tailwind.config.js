/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#1c384e", // Medical Blue
        secondary: "#95262c", // Blood Red
        primaryF: "#0284c7", // Medical Blue (Sky 600)
        secondaryS: "#dc2626", // Blood Red (Red 600)
        "background-light": "#fcfbf6",
        "background-dark": "#0f172a", // Slate 900
        "surface-light": "#f8fafc", // Slate 50
        "surface-dark": "#1e293b", // Slate 800
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
