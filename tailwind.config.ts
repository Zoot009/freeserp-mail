import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4f46e5",
          fg: "#ffffff",
          muted: "#eef2ff",
        },
      },
    },
  },
  plugins: [],
};

export default config;
