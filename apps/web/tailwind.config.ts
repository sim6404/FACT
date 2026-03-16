import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fact: {
          50: "#f2f7ff",
          100: "#d9e7ff",
          200: "#b2d0ff",
          300: "#7eafff",
          400: "#4a87ff",
          500: "#1f66f5",
          600: "#124dcb",
          700: "#103ea4",
          800: "#123787",
          900: "#152f6f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
