import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        oled: "#000000",
        gunmetal: {
          900: "var(--gunmetal-900)",
          800: "var(--gunmetal-800)",
          700: "var(--gunmetal-700)",
        },
        target: "#00D632",
        stop: "#FF334B",
        breakeven: "#FFBF00",
        glass: "rgba(255, 255, 255, 0.03)",
        glassBorder: "rgba(255, 255, 255, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
