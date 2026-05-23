/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
          950: "var(--accent-950)",
        },
        secondary: {
          400: "var(--secondary-400)",
          500: "var(--secondary-500)",
          600: "var(--secondary-600)",
          700: "var(--secondary-700)",
        },
        night: "#0a0d12",
        abyss: "#060809",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 30px rgba(var(--accent-rgb), 0.25)",
        "glow-secondary": "0 0 30px rgba(var(--secondary-rgb), 0.2)",
        card: "0 20px 60px rgba(0, 0, 0, 0.3)",
      },
      borderRadius: {
        xl: "18px",
        "2xl": "24px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "ambient-float": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.25" },
          "50%": { transform: "translateY(-30px) scale(1.15)", opacity: "0.1" },
          "100%": { transform: "translateY(-60px) scale(1.3)", opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(var(--accent-rgb),0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(var(--accent-rgb),0.35)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "ambient-float": "ambient-float 4s ease-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
