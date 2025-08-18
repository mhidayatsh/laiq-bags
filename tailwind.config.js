/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/*.js",
    "./routes/*.js",
    "./models/*.js",
    "./middleware/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'gold': '#D4AF37',
        'charcoal': '#36454F',
        'beige': '#F5F5DC'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp')
  ],
} 