import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Philippine flag: royal blue, scarlet red, golden yellow — on white.
        "flag-blue": "#0038A8",
        "flag-red": "#CE1126",
        "flag-yellow": "#FCD116",
        ink: "#0B1B3A",
        mist: "#F5F8FF",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      keyframes: {
        "slow-spin": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "slow-spin": "slow-spin 120s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
