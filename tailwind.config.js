/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-emerald-400', 'bg-emerald-500', 'ring-emerald-400/15',
    'bg-sky-400', 'bg-sky-500', 'ring-sky-400/15',
    'bg-violet-400', 'bg-violet-500', 'ring-violet-400/15',
    'bg-rose-400', 'bg-rose-500', 'ring-rose-400/15',
    'bg-amber-400', 'bg-amber-500', 'ring-amber-400/15',
    'bg-teal-400', 'bg-teal-500', 'ring-teal-400/15',
    'bg-stone-400', 'bg-stone-500', 'ring-stone-400/15',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
