import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nm: {
          bg:        '#1a1a1e',
          surface:   '#252529',
          surface2:  '#2d2d33',
          blue:      '#5b94d6',
          'blue-dim':'#1f2d45',
          text:      '#f0f0f5',
          muted:     '#88889a',
          faint:     '#4a4a5a',
        },
      },
    },
  },
  plugins: [],
};
export default config;
