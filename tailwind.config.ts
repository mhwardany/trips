import type { Config } from 'tailwindcss';

/** Royal Black Luxury theme tokens */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        royal: {
          black: '#0B1120',
          dark: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          gold: '#3B82F6', // Blue-500
          goldsoft: '#38BDF8', // Sky-400
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          muted: '#94A3B8'
        },
        resort: {
          ocean: '#2563EB', // Blue-600 (Primary Blue)
          coral: '#4F46E5', // Indigo-600 (Deep Violet-Blue)
          sunset: '#0D9488', // Teal-600 (Contrasting Cool)
          peach: '#475569', // Slate-600 (Neutral Cool)
          emerald: '#0891B2', // Cyan-600 (Bright Contrast)
          amethyst: '#6366F1', // Indigo-500 (Vibrant Violet)
        }
      },
      fontFamily: { sans: ['Nunito', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'], display: ['Quicksand', 'IBM Plex Sans Arabic', 'sans-serif'] },
      boxShadow: { gold: '0 0 24px rgba(244,63,94,0.18)' },
      borderRadius: { xl2: '1.25rem' }
    }
  },
  plugins: []
};
export default config;
