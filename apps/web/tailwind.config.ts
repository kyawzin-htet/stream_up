import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        ink: '#0b0f14',
        mist: '#f2f4f7',
        brand: '#0ea5e9',
        accent: '#f97316',
      },
      boxShadow: {
        lift: '0 20px 50px rgba(15, 23, 42, 0.12)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at 10% 10%, rgba(14,165,233,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(249,115,22,0.18), transparent 40%)',
      },
    },
  },
  plugins: [],
};

export default config;
