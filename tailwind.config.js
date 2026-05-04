/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sovereign: {
          gold: "#D4AF37",
          dark: "#0A0A0F",
          deeper: "#06060A",
          card: "#12121A",
          border: "#1E1E2E",
          accent: "#7C3AED",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          muted: "#6B7280",
          text: "#E5E7EB",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "scan-line": "scanLine 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(212, 175, 55, 0)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "50%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(-100%)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(212, 175, 55, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(212, 175, 55, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
