/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        raised: 'rgb(var(--color-raised) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        intensity: {
          0: '#6E9490',
          1: '#7A9A8E',
          2: '#879F8B',
          3: '#96A487',
          4: '#A6A883',
          5: '#B5A87E',
          6: '#BFA278',
          7: '#C69972',
          8: '#C98D6B',
          9: '#C78065',
          10: '#C4725F',
        },
      },
      fontSize: {
        base: ['17px', '26px'],
        lg: ['20px', '30px'],
        xl: ['24px', '32px'],
        '2xl': ['32px', '40px'],
        '3xl': ['44px', '52px'],
        '4xl': ['64px', '68px'],
      },
    },
  },
  plugins: [],
};
