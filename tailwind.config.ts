import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace"],
      },
      colors: {
        surface: {
          0: "#0a0a0b",
          1: "#111113",
          2: "#18181c",
          3: "#222228",
          4: "#2c2c35",
        },
        border: "#2e2e38",
        accent: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
          muted: "#3730a3",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        text: {
          primary: "#f4f4f6",
          secondary: "#9898a8",
          muted: "#5c5c72",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
