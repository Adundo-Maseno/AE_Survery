/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./field.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '420px'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif']
      },
      colors: {
        canopy: '#141A17',
        emeraldBrand: '#247B50',
        emeraldVivid: '#1F6A45',
        harvestGold: '#92400E',
        fieldStone: '#F4F6F4'
      }
    }
  },
  plugins: []
};

