/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--bg))',
        foreground: 'rgb(var(--fg))',
        card: 'rgb(var(--card))',
        'muted-foreground': 'rgb(var(--muted))',
        muted: 'rgb(var(--muted))',
        border: 'rgb(var(--border))',
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-fg))',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-fg))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary))',
          foreground: 'rgb(var(--secondary-fg))',
        },
        success: 'rgb(var(--success))',
        warning: 'rgb(var(--warning))',
        destructive: 'rgb(var(--destructive))',
      },
    },
  },
  plugins: [],
}
