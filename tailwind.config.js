/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B132B", // Dark Blue (Nền)
          surface: "#121C3A", // Blue nhat (Card)
          surface2: "#1C2541", // Blue nhat hon (Hover)
          accent: "#F3BA2F", // Vàng cam (Trang thai hoac Nut nhan - Binance hue)
          text: "#E0FBFC", // Chữ (Trang xanh)
          muted: "#8AA2CA", // Text mo
        },
      },
    },
  },
  plugins: [],
};
