/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                // Brand blue (replaces the Netflix red accent)
                brand: {
                    DEFAULT: "#3B82F6",
                    400: "#60A5FA",
                    500: "#3B82F6",
                },
                // Dark, Netflix-style surfaces + text
                background: "#141414",
                surface: "#1F1F1F",
                surface2: "#2A2A2A",
                content: "#F5F5F5",
                muted: "#9CA3AF",
                line: "#FFFFFF",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
            },
            boxShadow: {
                glow: "0 0 0 1px rgba(59,130,246,0.40), 0 20px 55px -12px rgba(37,99,235,0.55)",
                "glow-sm": "0 0 24px -4px rgba(59,130,246,0.55)",
                card: "0 12px 34px -14px rgba(0,0,0,0.8)",
            },
            backgroundImage: {
                "accent-gradient": "linear-gradient(135deg, #3B82F6, #2563EB)",
                "hero-fade": "linear-gradient(to top, #141414 6%, rgba(20,20,20,0.6) 45%, rgba(20,20,20,0.15) 75%, rgba(20,20,20,0) 100%)",
                "card-fade": "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0) 100%)",
            },
            keyframes: {
                shimmer: {
                    "100%": { transform: "translateX(100%)" },
                },
            },
            animation: {
                shimmer: "shimmer 1.6s infinite",
            },
        },
    },
    plugins: [],
};
