/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        secondary: '#fb923c',
        'primary-50': '#fff7ed',
        'primary-100': '#ffedd5',
        'primary-200': '#fed7aa',
        'primary-300': '#fdba74',
        'primary-400': '#fb923c',
        'primary-500': '#f97316',
        'primary-600': '#ea580c',
        'primary-700': '#c2410c',
        'primary-800': '#9a3412',
        'primary-900': '#7c2d12',
        'secondary-50': '#fff7ed',
        'secondary-100': '#ffedd5',
        'secondary-200': '#fed7aa',
        'secondary-300': '#fdba74',
        'secondary-400': '#fb923c',
        'secondary-500': '#f97316',
        'secondary-600': '#ea580c',
        'secondary-700': '#c2410c',
        'secondary-800': '#9a3412',
        'secondary-900': '#7c2d12',
      },
      fontFamily: {
        'pacifico': ['Pacifico', 'cursive'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
        'button': '8px'
      }
    },
  },
  plugins: [],
}
