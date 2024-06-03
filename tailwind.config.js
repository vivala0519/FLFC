/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dnf-bit': ['DNFBitBitv2', 'serif'], // 폰트 패밀리 정의
      },
      backgroundImage: {
        'sun': "url('@/assets/sun2.png')",
      },
    },
  },
  plugins: [],
}