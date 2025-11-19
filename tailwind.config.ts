import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f8',
          100: '#eef0f2',
          200: '#d7dce2',
          300: '#b3bfcb',
          400: '#8fa2b3',
          500: '#6b869c',
          600: '#506a80',
          700: '#3f5364',
          800: '#2d3b47',
          900: '#1a232b'
        }
      }
    }
  },
  plugins: []
} satisfies Config
