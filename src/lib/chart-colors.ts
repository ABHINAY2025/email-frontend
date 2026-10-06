import type { ApplicationStatus } from '@/types/api';
import type { ResolvedTheme } from './theme';

/**
 * Chart palette. SVG fills need concrete colors, so the CSS hue tokens are mirrored here
 * as hex per theme (light steps darker for contrast on white; dark steps lighter for the
 * dark surface). Status colors follow the badge hues so charts and badges read as one system.
 */
interface ChartTheme {
  surface: string;
  grid: string;
  axis: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  status: Record<ApplicationStatus, string>;
  funnel: [string, string, string, string];
}

const light: ChartTheme = {
  surface: '#ffffff',
  grid: '#ececef',
  axis: '#d9dadf',
  text: '#16171a',
  textMuted: '#6b6f78',
  accent: '#4a56c4',
  accentSoft: 'rgba(74, 86, 196, 0.10)',
  status: {
    APPLIED: '#5b6b82',
    UNDER_REVIEW: '#2a78d6',
    ASSESSMENT: '#7357c8',
    RECRUITER_CONTACT: '#1a8a86',
    INTERVIEW: '#c98500',
    OFFER: '#1f8a52',
    REJECTED: '#cf4a4a',
    WITHDRAWN: '#8a8e96',
    CLOSED: '#a3a6ad',
  },
  // Ordinal single-hue ramp (indigo), lightest step still clears 2:1 on white
  funnel: ['#3c47ad', '#5763c9', '#7883d6', '#99a1e1'],
};

const dark: ChartTheme = {
  surface: '#141518',
  grid: '#212328',
  axis: '#2c2e34',
  text: '#e8e9eb',
  textMuted: '#8b8f98',
  accent: '#7c86e0',
  accentSoft: 'rgba(124, 134, 224, 0.12)',
  status: {
    APPLIED: '#8b9bb4',
    UNDER_REVIEW: '#5a9ae8',
    ASSESSMENT: '#a08ae6',
    RECRUITER_CONTACT: '#3fbcb3',
    INTERVIEW: '#e0a33c',
    OFFER: '#4cbb7f',
    REJECTED: '#e06c6c',
    WITHDRAWN: '#6c7079',
    CLOSED: '#565a62',
  },
  funnel: ['#8f98ea', '#7480d9', '#5c67c3', '#4a54a8'],
};

export function chartTheme(resolved: ResolvedTheme): ChartTheme {
  return resolved === 'dark' ? dark : light;
}
