/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#000000',
        'bg-dark-alt': '#0A0A0A',
        'text-primary': '#FFFFFF',
        'text-secondary': '#E0E0E0',
        'text-muted': '#A0A0A0',
        'text-nav': '#333333',
        'accent-cyan': '#00BCD4',
        'accent-cyan-hero': 'rgb(0, 255, 255)',
        'accent-cyan-circle': 'rgb(0, 150, 255)',
        'accent-magenta': '#E000E0',
        'accent-gold': 'rgb(255, 215, 0)',
        'accent-green': 'rgb(0, 255, 127)',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'hero-title': ['4rem', { lineHeight: '1.1', letterSpacing: '0.04em' }],
        'section-title': ['2.5rem', { lineHeight: '1.2', letterSpacing: '0.02em' }],
      },
      spacing: {
        'section-py': '6rem',
        'section-py-mobile': '4rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
