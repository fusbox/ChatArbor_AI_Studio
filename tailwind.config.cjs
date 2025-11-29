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
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        },
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',

        // Semantic Colors
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',

        // Legacy/Brand mappings (for backward compatibility where possible, or updated to use vars)
        brand: {
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)', // Mapped to primary-dark
          purple: 'rgb(var(--color-primary) / <alpha-value>)',    // Mapped to primary
          grey: 'rgb(var(--color-primary-light) / <alpha-value>)', // Mapped to primary-light
          blue: 'rgb(var(--color-secondary) / <alpha-value>)',     // Mapped to secondary
          pale: 'rgb(var(--color-accent) / <alpha-value>)',       // Mapped to accent
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          'bg-light': 'rgb(var(--color-bg) / <alpha-value>)',
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
