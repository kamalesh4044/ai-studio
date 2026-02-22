/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8fb",
          100: "#eceff6",
          200: "#d9deea",
          300: "#b8c1d8",
          400: "#8f9ab8",
          500: "#6b7798",
          600: "#515d7d",
          700: "#3b4664",
          800: "#242d47",
          900: "#11182f"
        },
        accent: {
          50: "#edfcff",
          100: "#cdf7ff",
          200: "#9bf0ff",
          300: "#5ce2fd",
          400: "#22ccf0",
          500: "#0aaecf",
          600: "#0789a8",
          700: "#0c6e87",
          800: "#14586b",
          900: "#154a59"
        }
      },
      boxShadow: {
        panel: "0 20px 45px -28px rgba(17, 24, 47, 0.48)"
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans",
          "Avenir Next",
          "Segoe UI",
          "Helvetica Neue",
          "sans-serif"
        ],
        mono: ["IBM Plex Mono", "Consolas", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};
