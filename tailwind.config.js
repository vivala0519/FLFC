const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
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
        'request': "url('@/assets/request.png')",
        'laurel': "url('@/assets/laurel.png')",
      },
      textColor: {
        goal: '#bb2649',
        assist: '#eab308',
        signature: '#166534',
        vivaMagenta: '#BB2649',
      },
      boxShadow: {
        'custom': '0 0 10px rgba(0, 0, 0, 0.5)',
      }
    },
    screens: {
      'mobile': {'max': '821px'},
      'desktop': {'min': '822px'},
    },
  },
  plugins: [
    require('tailwindcss-pseudo-elements'),
    plugin(function({ addUtilities }) {
      const newUtilities = {
        '.content-empty': {
          content: "''",
        },
        '.after-content-empty::after': {
          content: "''",
        },
        '.after-bg-cover::after': {
          'background-size': 'cover',
        },
        '.after-absolute::after': {
          position: 'absolute',
        },
      };
      addUtilities(newUtilities, ['before', 'after']);
    }),
  ],
}