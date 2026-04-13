export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#fff1f1', 500:'#ef4444', 600:'#dc2626', 700:'#b91c1c' },
        emergency: { low:'#22c55e', medium:'#f59e0b', high:'#ef4444', critical:'#7c3aed' },
      },
    },
  },
  plugins: [],
};