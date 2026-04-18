/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Định nghĩa font family tại đây
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'brand': ['Inter', 'Roboto', 'sans-serif'], // Tất cả đều là font hiện đại, không chân
      },
      borderRadius: {
        'circle': '50%', // Ghi đè giá trị mặc định của rounded-md
      }
    },
  },
  plugins: [],
}