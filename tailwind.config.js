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
        leftDark: "url('@/assets/white-left.png')",
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
        salah: "url('@/assets/salah.webp')",
        myTeam: "url('@/assets/friendship.webp')",
        palmer: "url('@/assets/palmer.webp')",
        ronaldo: "url('@/assets/ronaldo.webp')",
        rodrigo: "url('@/assets/rodrigo.webp')",
        DeBruyne: "url('@/assets/DeBruyne.webp')",
        CJamChul: "url('@/assets/CJamChul.webp')",
        sonKaeDuo: "url('@/assets/sonKaeDuo.webp')",
        slowStarter: "url('@/assets/slowStarter.webp')",
        earlyStarter: "url('@/assets/earlyStarter.webp')",
      },
      textColor: {
        goal: '#bb2649',
        assist: '#eab308',
        signature: '#166534',
        vivaMagenta: '#BB2649',
        teamWin: '#21009A',
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
          '25%': { transform: 'translateY(-2px)' },
          '75%': { transform: 'translateY(2px)' },
          '0%, 50%, 100%': { transform: 'translateY(0)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shineEffect: {
          '0%': { transform: 'rotate(45deg) translateX(-150%)' },
          '100%': { transform: 'rotate(45deg) translateX(150%)' },
        },
        spinVertical: {
          '0%': { transform: 'rotateY(0deg) rotate(45deg)' },
          '100%': { transform: 'rotateY(360deg) rotate(45deg)' },
        },
        'goal-roll': {
          '0%': { transform: 'translateX(100vw) rotate(0deg)' },
          '100%': { transform: 'translateX(0) rotate(-2160deg)' },
        },
      },
      animation: {
        shineEffect: 'shineEffect 2s infinite',
        spinSlow: 'spinSlow 7s linear infinite',
        flipX: 'flipX 0.9s ease-in-out infinite',
        flipY: 'flipY 0.9s ease-in-out infinite',
        spinVertical: 'spinVertical 0.3s linear infinite',
        bounceUpDown: 'bounceUpDown 1s ease-in-out infinite',
        'goal-roll': 'goal-roll 0.8s ease-out forwards',
      },
      transform: {
        'rotate-y-180': 'rotateY(180deg)',
      },
    },
    screens: {
      mobile: { max: '821px' },
      desktop: { min: '822px' },
    },
  },
  safelist: [
    {
      pattern:
        /bg-(salah|myTeam|palmer|ronaldo|rodrigo|DeBruyne|CJamChul|sonKaeDuo|slowStarter|earlyStarter|laurel)/,
    },
  ],
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
