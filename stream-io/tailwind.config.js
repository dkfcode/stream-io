/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0a',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.05)',
          'white-strong': 'rgba(255, 255, 255, 0.1)',
          'white-border': 'rgba(255, 255, 255, 0.15)',
          'white-hover': 'rgba(255, 255, 255, 0.08)',
          black: 'rgba(0, 0, 0, 0.3)',
          'black-strong': 'rgba(0, 0, 0, 0.5)',
          purple: 'rgba(147, 51, 234, 0.1)',
          'purple-strong': 'rgba(147, 51, 234, 0.2)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '42': '10.5rem',
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        'glass-shimmer': 'glass-shimmer 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glass-shimmer': {
          '0%, 100%': { 
            'background-position': '-200% 0',
            opacity: '1'
          },
          '50%': { 
            'background-position': '200% 0',
            opacity: '0.8'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
        '5xl': '96px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass-strong': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'vision': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
      },
    },
  },
  plugins: [],
};