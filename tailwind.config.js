// Tailwind's default font-size scale, with size and rem-based line-height
// multiplied by --font-scale (1 by default, raised for mobile in main.css) so
// every text-* utility resizes globally without per-component changes.
const scaled = (size, lineHeight) => [
  `calc(${size} * var(--font-scale, 1))`,
  {
    lineHeight: lineHeight.endsWith('rem')
      ? `calc(${lineHeight} * var(--font-scale, 1))`
      : lineHeight,
  },
]

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    fontSize: {
      xs: scaled('0.75rem', '1rem'),
      sm: scaled('0.875rem', '1.25rem'),
      base: scaled('1rem', '1.5rem'),
      lg: scaled('1.125rem', '1.75rem'),
      xl: scaled('1.25rem', '1.75rem'),
      '2xl': scaled('1.5rem', '2rem'),
      '3xl': scaled('1.875rem', '2.25rem'),
      '4xl': scaled('2.25rem', '2.5rem'),
      '5xl': scaled('3rem', '1'),
      '6xl': scaled('3.75rem', '1'),
      '7xl': scaled('4.5rem', '1'),
      '8xl': scaled('6rem', '1'),
      '9xl': scaled('8rem', '1'),
    },
    extend: {
      colors: {
        'garden-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'flower-pink': {
          300: '#f9a8d4',
        },
        'flower-yellow': {
          300: '#fde047',
        },
        'earth-brown': {
          400: '#a3a3a3',
        },
        'sky-blue': {
          200: '#bfdbfe',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'heading': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}