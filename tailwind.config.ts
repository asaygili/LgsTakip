import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#bcdcff",
          300: "#8ec4ff",
          400: "#59a3ff",
          500: "#3280ff",
          600: "#1c5ff5",
          700: "#1749e1",
          800: "#193cb6",
          900: "#1a388f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
