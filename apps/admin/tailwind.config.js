/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3B82F6',
          400: '#60A5FA',
        },
        ink: '#141414',
        panel: '#1F1F1F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3B82F6, #2563EB)',
      },
      boxShadow: {
        'glow-sm': '0 0 22px -6px rgba(59,130,246,0.55)',
      },
    },
  },
  plugins: [],
};
