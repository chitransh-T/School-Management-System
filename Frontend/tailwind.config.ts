import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      screens: {
        'sm': '640px',    // Mobile (larger phones)
        'md': '768px',    // Tablet
        'lg': '1024px',   // Desktop
        'xl': '1280px',   // Large Desktop
        '2xl': '1536px',  // Extra Large Desktop
      },
    },
  },
  plugins: [],
} satisfies Config;
