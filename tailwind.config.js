/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Nueva paleta principal - Sistema de Colores Tierra Oscura
        "tiyc-primary": "#96572a",
        "tiyc-primary-light": "#b8744d",
        "tiyc-primary-dark": "#7a4521",
        "tiyc-secondary": "#8b4513",
        "tiyc-accent": "#a0692e",

        // Tonos de soporte
        "tiyc-light": "#f5f2e8",
        "tiyc-cream": "#e8dcc0",
        "tiyc-muted": "#d4c4a8",

        // Colores semánticos
        "tiyc-success": "#4a7c59",
        "tiyc-warning": "#b8744d",
        "tiyc-error": "#8b4513",
        "tiyc-info": "#6b8e7a",

        // DEPRECATED - Mantener por compatibilidad
        "tiyc-brown": "#8b4513",
        "tiyc-tan": "#d4a574",
        "tiyc-header": "#cb8251",
        "tiyc-form": "#c47b4e",
        "tiyc-button": "#9a4422",
      },
      
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
      
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "float": "float 3s ease-in-out infinite",
        "fadeIn": "fadeIn 0.3s ease-in-out",
        "slideIn": "slideIn 0.3s ease-out",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
      },
      
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      
      boxShadow: {
        "tiyc": "0 4px 16px rgba(150, 87, 42, 0.15)",
        "tiyc-lg": "0 8px 24px rgba(150, 87, 42, 0.2)",
        "tiyc-xl": "0 12px 32px rgba(150, 87, 42, 0.25)",
      },
      
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      
      borderRadius: {
        "xl": "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  
  plugins: [require("daisyui")],
  
  daisyui: {
    themes: [
      {
        tiyc: {
          primary: "#96572a",
          "primary-content": "#ffffff",
          secondary: "#8b4513",
          "secondary-content": "#ffffff",
          accent: "#a0692e",
          "accent-content": "#ffffff",
          neutral: "#666666",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f5f2e8",
          "base-300": "#e8dcc0",
          "base-content": "#96572a",
          info: "#6b8e7a",
          "info-content": "#ffffff",
          success: "#4a7c59",
          "success-content": "#ffffff",
          warning: "#b8744d",
          "warning-content": "#ffffff",
          error: "#8b4513",
          "error-content": "#ffffff",
        },
      },
    ],
  },
};