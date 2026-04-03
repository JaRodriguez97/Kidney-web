/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,ts}"],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				primary: "#1c384e", // Medical Blue
				primary_p: "#0284c7",
				secondary: "#95262c", // Blood Red
				primaryF: "#0284c7", // Medical Blue (Sky 600)
				secondaryS: "#dc2626", // Blood Red (Red 600)
				"background-light": "#fcfbf6",
				"background-dark": "#0f172a", // Slate 900
				"surface-light": "#f8fafc", // Slate 50
				"surface-dark": "#1e293b", // Slate 800
				"surface-glass": "rgba(255, 255, 255, 0.7)",
				"border-glass": "rgba(255, 255, 255, 0.5)",
			},
			fontFamily: {
				sans: ["'Plus Jakarta Sans'", "sans-serif"],
			},
			borderRadius: {
				DEFAULT: "0.5rem",
				"3xl": "24px",
				20: "20px",
			},
			boxShadow: {
				glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
				glow: "0 0 15px rgba(28, 56, 78, 0.15)",
				"glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
				"card-hover": "0 10px 40px -10px rgba(2, 132, 199, 0.15)",
			},
		},
	},
	plugins: [],
};
