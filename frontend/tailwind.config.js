/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#534AB7',
          hover:   '#7F77DD',
          light:   '#EEEDFE',
        },
        success: {
          DEFAULT: '#1D9E75',
          light:   '#E1F5EE',
          dark:    '#0F6E56',
        },
        warning: {
          DEFAULT: '#BA7517',
          light:   '#FAEEDA',
          dark:    '#854F0B',
        },
        danger: {
          DEFAULT: '#993556',
          light:   '#FBEAF0',
          dark:    '#72243E',
        },
        bg: {
          page:   '#F1F5F9',
          card:   '#FFFFFF',
          subtle: '#F8FAFC',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong:  '#CBD5E1',
        },
        text: {
          primary: '#1E293B',
          muted:   '#64748B',
          hint:    '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        dropdown: '0 4px 16px 0 rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}