/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: '#0A0E17',
        bgElevated: '#111827',
        bgHover: '#1F2937',
        borderSubtle: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.1)',
        neonGreen: '#00FF88',
        indigo: '#6366f1',
        coralRed: '#FF4D4D',
        violet: '#8B5CF6',
        textPrimary: '#F9FAFB',
        textSecondary: '#D1D5DB',
        textMuted: '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'Rubik', 'system-ui', 'sans-serif'],
        mono: ['monospace'],
      }
    },
  },
  plugins: [],
}
