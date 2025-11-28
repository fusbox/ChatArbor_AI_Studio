module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx,js,jsx}',
    './contexts/**/*.{ts,tsx,js,jsx}',
    './hooks/**/*.{ts,tsx,js,jsx}',
    './services/**/*.{ts,tsx,js,jsx}',
    './tests/**/*.{ts,tsx,js,jsx}',
    './e2e/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#554971', // Purple
          light: '#63768d',   // Greyish Blue
          dark: '#36213e',    // Dark Purple/Black
        },
        secondary: '#8ac6d0', // Light Blue
        accent: '#b8f3ff',    // Pale Blue
        brand: {
          dark: '#1B1120',
          purple: '#554971',
          grey: '#63768d',
          blue: '#8ac6d0',
          pale: '#b8f3ff',
          surface: '#ffffff',
          'bg-light': '#f8fafc', // Slate-50, crisp and clean
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};
