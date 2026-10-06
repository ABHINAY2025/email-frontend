import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const hue = (name: string) => `hsl(var(--hue-${name}) / <alpha-value>)`;

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
      },
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
          accent: 'hsl(var(--sidebar-accent) / <alpha-value>)',
          border: 'hsl(var(--sidebar-border) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        subtle: 'hsl(var(--subtle) / <alpha-value>)',
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        elevated: 'hsl(var(--elevated) / <alpha-value>)',
        hue: {
          slate: hue('slate'),
          blue: hue('blue'),
          violet: hue('violet'),
          teal: hue('teal'),
          amber: hue('amber'),
          green: hue('green'),
          red: hue('red'),
          gray: hue('gray'),
          indigo: hue('indigo'),
          pink: hue('pink'),
          orange: hue('orange'),
        },
      },
      borderRadius: {
        xl: '12px',
        lg: '10px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        popover: '0 8px 24px -6px rgb(0 0 0 / 0.35), 0 2px 6px -2px rgb(0 0 0 / 0.2)',
      },
      keyframes: {
        'collapsible-down': { from: { height: '0' }, to: { height: 'var(--radix-collapsible-content-height)' } },
        'collapsible-up': { from: { height: 'var(--radix-collapsible-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'collapsible-down': 'collapsible-down 150ms ease-out',
        'collapsible-up': 'collapsible-up 150ms ease-out',
      },
      transitionDuration: { DEFAULT: '150ms' },
    },
  },
  plugins: [animate],
} satisfies Config;
