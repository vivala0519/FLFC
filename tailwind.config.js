const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        'dnf-bit': ['DNFBitBitv2', 'serif'],
        giants: ['Giants-Inline', 'normal'],
        suite: ['SUITE-Regular', 'normal'],
        'dnf-forged': ['DNFForgedBlade', 'serif'],
        kbo: ['KBO-Dia-Gothic_bold', 'serif'],
        hahmlet: ['Hahmlet', 'serif'],
      },
      backgroundImage: {
        sun: "url('@/assets/sun2.png')",
        request: "url('@/assets/request.png')",
        laurel: "url('@/assets/laurel.png')",
        left: "url('@/assets/left.png')",
        right: "url('@/assets/right.png')",
        kakao: "url('@/assets/kakao.png')",
        'kakao-login': "url('@/assets/kakao_login_medium.png')",
        attend: "url('@/assets/keep_ball.png')",
        absent: "url('@/assets/uncheck_ball.png')",
        keeping: "url('@/assets/check_ball.png')",
        loading: "url('@/assets/minning.gif')",
        homeLight: "url('@/assets/home-light.png')",
        homeDark: "url('@/assets/home-dark.png')",
        football: "url('@/assets/circle-ball.png')",
      },
      textColor: {
        goal: '#bb2649',
        assist: '#eab308',
        signature: '#166534',
        vivaMagenta: '#BB2649',
      },
      boxShadow: {
        custom: '0 0 10px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        flipX: {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(180deg)' },
        },
        flipY: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        bounceUpDown: {
          '0%, 50%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-2px)' },
          '75%': { transform: 'translateY(2px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        flipX: 'flipX 0.9s ease-in-out infinite',
        flipY: 'flipY 0.9s ease-in-out infinite',
        bounceUpDown: 'bounceUpDown 1s ease-in-out infinite',
        spinSlow: 'spinSlow 7s linear infinite',
      },
    },
    screens: {
      mobile: { max: '821px' },
      desktop: { min: '822px' },
    },
  },
  plugins: [
    require('tailwindcss-pseudo-elements'),
    plugin(function ({ addUtilities }) {
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
      }
      addUtilities(newUtilities, ['before', 'after'])
    }),
  ],
}
