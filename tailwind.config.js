/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dnf-bit': ['DNFBitBitv2', 'serif'],
        'giants': ['Giants-Inline', 'normal'],
        'suite': ['SUITE-Regular', 'normal'],
        'dnf-forged': ['DNFForgedBlade', 'serif'],
        'kbo': ['KBO-Dia-Gothic_bold', 'serif'],
        'hahmlet': ['Hahmlet', 'serif'],
      },
      backgroundImage: {
        'sun': "url('@/assets/sun2.png')",
      },
    },
    screens: {
      'mobile': {'max': '821px'},
    },
  },
  plugins: [],
}