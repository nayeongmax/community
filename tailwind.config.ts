import type { Config } from 'tailwindcss';

/* 디자인 토큰 — 잉크(남색) 한 가지를 중심으로, 금색은 포인트로만 */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14172b', soft: '#252a45', mute: '#6b7180', faint: '#9aa0b0' },
        hair: '#e6e8ef',
        ground: '#f7f8fa',
        gold: { DEFAULT: '#a87b22', soft: '#f5c765', wash: '#fdf6e6' },
      },
      fontFamily: {
        sans: ['var(--font-noto)', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config;
