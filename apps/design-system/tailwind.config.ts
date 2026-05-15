import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Neutral scale
        neutral: {
          0: '#FFFFFF',
          25: '#F8FAFB',
          50: '#F1F5F8',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#475569',
          600: '#334155',
          700: '#1E293B',
          800: '#141E2B',
          900: '#0E1117',
        },
        // Brand teal
        brand: {
          50: '#E0F2F7',
          100: '#B3E3EF',
          200: '#7DD1E7',
          300: '#3DBEDD',
          400: '#0EB0D1',
          500: '#0A9DBD',
          600: '#0A87A3',
          700: '#0A6F87',
          800: '#0A5870',
          900: '#0A4F6E',
        },
        // Module: Patient (blue)
        patient: {
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
          800: '#1E40AF', 900: '#1E3A8A',
        },
        // Module: Staff (violet)
        staff: {
          50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD',
          400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9',
          800: '#5B21B6', 900: '#4C1D95',
        },
        // Module: Consult (teal-green)
        consult: {
          50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4',
          400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E',
          800: '#115E59', 900: '#134E4A',
        },
        // Module: Records (forest green)
        records: {
          50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
          400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
          800: '#166534', 900: '#14532D',
        },
        // Module: Equipment (amber/bronze)
        equipment: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
          800: '#92400E', 900: '#78350F',
        },
        // Semantic surfaces
        surface: {
          canvas: '#F8FAFB',
          raised: '#FFFFFF',
          sunken: '#F1F5F8',
        },
        // Semantic borders
        border: {
          subtle: '#F1F5F8',
          default: '#E2E8F0',
          strong: '#94A3B8',
          focus: '#0EA5E9',
          critical: '#DC2626',
        },
        // Semantic text
        text: {
          primary: '#0E1117',
          secondary: '#475569',
          tertiary: '#94A3B8',
          disabled: '#CBD5E1',
          inverse: '#FFFFFF',
          link: '#0A87A3',
          danger: '#DC2626',
        },
      },
      fontFamily: {
        ui: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.25', letterSpacing: '-0.05em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.25', letterSpacing: '-0.05em' }],
        'display-lg':  ['3rem',    { lineHeight: '1.25', letterSpacing: '-0.025em' }],
        'display-md':  ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.025em' }],
        'display-sm':  ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.025em' }],
        'h1': ['1.875rem', { lineHeight: '1.375', letterSpacing: '-0.025em' }],
        'h2': ['1.5rem',   { lineHeight: '1.375', letterSpacing: '-0.025em' }],
        'h3': ['1.25rem',  { lineHeight: '1.375' }],
        'h4': ['1.125rem', { lineHeight: '1.375' }],
        'h5': ['1rem',     { lineHeight: '1.5' }],
        'h6': ['0.875rem', { lineHeight: '1.5' }],
        'body-lg': ['1.125rem', { lineHeight: '1.625' }],
        'body':    ['1rem',     { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem',  { lineHeight: '1.5' }],
        'label':   ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem',  { lineHeight: '1.5' }],
        'overline':['0.6875rem',{ lineHeight: '1.5', letterSpacing: '0.1em' }],
        'vitals-xl': ['2.5rem', { lineHeight: '1' }],
        'vitals-lg': ['2rem',   { lineHeight: '1' }],
        'vitals-md': ['1.5rem', { lineHeight: '1' }],
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      boxShadow: {
        1: '0 1px 2px rgba(14,17,23,0.06), 0 0 0 1px rgba(14,17,23,0.04)',
        2: '0 2px 8px rgba(14,17,23,0.08), 0 1px 2px rgba(14,17,23,0.04)',
        3: '0 8px 24px rgba(14,17,23,0.10), 0 2px 4px rgba(14,17,23,0.05)',
        4: '0 16px 48px rgba(14,17,23,0.14), 0 4px 8px rgba(14,17,23,0.06)',
        5: '0 24px 64px rgba(14,17,23,0.18), 0 8px 16px rgba(14,17,23,0.08)',
      },
      transitionDuration: {
        instant: '0ms',
        fast: '100ms',
        normal: '200ms',
        slow: '350ms',
        slower: '500ms',
      },
      transitionTimingFunction: {
        'ease-in':  'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.4, 0.64, 1)',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1100',
        'modal-backdrop': '1200',
        modal: '1300',
        toast: '1400',
        tooltip: '1500',
        critical: '9999',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(4px)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        skeleton: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0, 0, 0.2, 1)',
        'fade-out': 'fade-out 100ms cubic-bezier(0.4, 0, 1, 1)',
        'slide-in-right': 'slide-in-right 350ms cubic-bezier(0, 0, 0.2, 1)',
        'slide-up': 'slide-up 200ms cubic-bezier(0, 0, 0.2, 1)',
        'pulse-dot': 'pulse-dot 1400ms ease-in-out infinite',
        skeleton: 'skeleton 1800ms ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
