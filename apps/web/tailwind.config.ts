import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        forest: { DEFAULT: '#165C34', dark: '#0E3D22', 50: '#F0FAF4', 100: '#E0F3E7' },
        cream: '#F8F7F0',
        lime: { 100: '#E8F5D4', 500: '#7CBF43' },
        line: '#E4E2D6',
        chopsave: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 900: '#14532d' },
      },
      boxShadow: { card: '0 1px 3px rgb(15 23 42 / 0.06)', 'card-lg': '0 12px 28px rgb(15 23 42 / 0.10)' },
    },
  },
  plugins: [],
};
export default config;
