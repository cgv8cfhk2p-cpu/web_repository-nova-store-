import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0a0a",
          900: "#0a0a0a",
          800: "#171717",
          700: "#262626",
          600: "#404040",
          500: "#737373",
          400: "#a3a3a3",
          300: "#d4d4d4",
          200: "#e5e5e5",
          100: "#f5f5f5",
          50: "#fafafa",
        },
      },
      letterSpacing: { brand: "0.32em" },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-in": { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .4s ease both",
        "slide-in": "slide-in .35s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
