import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        govnavy: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          600: '#1e3a8a',
          700: '#172554',
          800: '#0f172a',
          900: '#0a192f',
        },
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        govgreen: {
          50: '#f0fdf4',
          600: '#16a34a',
          700: '#15803d',
        },
      },
    },
  },
  plugins: [],
};
export default config;

