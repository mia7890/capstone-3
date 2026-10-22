/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./client/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        shell: "#18181b",
        canvas: "#f3f4f8",
        surface: "#ffffff",
        accentBlue: "#7eb0f5",
        accentBlueDark: "#3b82f6"
      },
      borderRadius: {
        "3xl": "26px",
        "4xl": "34px"
      }
    }
  },
  plugins: []
};
