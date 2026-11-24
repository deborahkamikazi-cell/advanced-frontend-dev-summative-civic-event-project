/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./pages/**/*.html",
    "./components/**/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        navy: "#172554",
        royal: "#2563EB",
        amber: "#F59E0B"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 1px 3px rgba(15,23,42,.08), 0 1px 2px rgba(15,23,42,.06)"
      }
    }
  },
  plugins: []
};
