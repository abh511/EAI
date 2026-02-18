/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────────────────────────
        brand: {
          50:  '#e6f7ff',
          100: '#bae7ff',
          500: '#1890ff',
          600: '#096dd9',
          700: '#0050b3',
          900: '#002766',
        },
        // ── Risk levels (AQI aligned) ─────────────────────────────────────────
        risk: {
          good:      '#00e400',   // AQI  0-50
          moderate:  '#ffff00',   // AQI 51-100
          sensitive: '#ff7e00',   // AQI 101-150
          unhealthy: '#ff0000',   // AQI 151-200
          very:      '#8f3f97',   // AQI 201-300
          hazardous: '#7e0023',   // AQI 301+
        },
        // ── Environmental pillar colours ──────────────────────────────────────
        pillar: {
          air:        '#60a5fa',
          water:      '#34d399',
          noise:      '#fbbf24',
          industrial: '#f87171',
          waste:      '#a78bfa',
          heat:       '#fb923c',
          groundwater:'#2dd4bf',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
