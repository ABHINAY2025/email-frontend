import {
  Ban,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Eye,
  type LucideIcon,
  MessagesSquare,
  PhoneCall,
  Send,
  Trophy,
  Undo2,
  XCircle,
} from 'lucide-react';
import type { ApplicationBucket, ApplicationStatus } from '@/types/api';

export type HueName =
  | 'slate'
  | 'blue'
  | 'violet'
  | 'teal'
  | 'amber'
  | 'green'
  | 'red'
  | 'gray'
  | 'indigo'
  | 'pink'
  | 'orange';

/** Tailwind classes per hue — kept literal so the JIT compiler sees them. */
export const HUE_CLASSES: Record<HueName, { text: string; bg: string; dot: string; border: string; soft: string }> = {
  slate: { text: 'text-hue-slate', bg: 'bg-hue-slate/10', dot: 'bg-hue-slate', border: 'border-hue-slate/25', soft: 'bg-hue-slate/[0.06]' },
  blue: { text: 'text-hue-blue', bg: 'bg-hue-blue/10', dot: 'bg-hue-blue', border: 'border-hue-blue/25', soft: 'bg-hue-blue/[0.06]' },
  violet: { text: 'text-hue-violet', bg: 'bg-hue-violet/10', dot: 'bg-hue-violet', border: 'border-hue-violet/25', soft: 'bg-hue-violet/[0.06]' },
  teal: { text: 'text-hue-teal', bg: 'bg-hue-teal/10', dot: 'bg-hue-teal', border: 'border-hue-teal/25', soft: 'bg-hue-teal/[0.06]' },
  amber: { text: 'text-hue-amber', bg: 'bg-hue-amber/10', dot: 'bg-hue-amber', border: 'border-hue-amber/25', soft: 'bg-hue-amber/[0.06]' },
  green: { text: 'text-hue-green', bg: 'bg-hue-green/10', dot: 'bg-hue-green', border: 'border-hue-green/25', soft: 'bg-hue-green/[0.06]' },
  red: { text: 'text-hue-red', bg: 'bg-hue-red/10', dot: 'bg-hue-red', border: 'border-hue-red/25', soft: 'bg-hue-red/[0.06]' },
  gray: { text: 'text-hue-gray', bg: 'bg-hue-gray/10', dot: 'bg-hue-gray', border: 'border-hue-gray/25', soft: 'bg-hue-gray/[0.06]' },
  indigo: { text: 'text-hue-indigo', bg: 'bg-hue-indigo/10', dot: 'bg-hue-indigo', border: 'border-hue-indigo/25', soft: 'bg-hue-indigo/[0.06]' },
  pink: { text: 'text-hue-pink', bg: 'bg-hue-pink/10', dot: 'bg-hue-pink', border: 'border-hue-pink/25', soft: 'bg-hue-pink/[0.06]' },
  orange: { text: 'text-hue-orange', bg: 'bg-hue-orange/10', dot: 'bg-hue-orange', border: 'border-hue-orange/25', soft: 'bg-hue-orange/[0.06]' },
};

export interface StatusMeta {
  label: string;
  hue: HueName;
  icon: LucideIcon;
  description: string;
}

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  APPLIED: { label: 'Applied', hue: 'slate', icon: Send, description: 'Application submitted' },
  UNDER_REVIEW: { label: 'Under Review', hue: 'blue', icon: Eye, description: 'Being reviewed by the company' },
  ASSESSMENT: { label: 'Assessment', hue: 'violet', icon: ClipboardList, description: 'Take-home or online assessment' },
  RECRUITER_CONTACT: { label: 'Recruiter', hue: 'teal', icon: PhoneCall, description: 'A recruiter reached out' },
  INTERVIEW: { label: 'Interview', hue: 'amber', icon: MessagesSquare, description: 'Interviewing' },
  OFFER: { label: 'Offer', hue: 'green', icon: Trophy, description: 'Offer received' },
  REJECTED: { label: 'Rejected', hue: 'red', icon: XCircle, description: 'Application rejected' },
  WITHDRAWN: { label: 'Withdrawn', hue: 'gray', icon: Undo2, description: 'You withdrew' },
  CLOSED: { label: 'Closed', hue: 'gray', icon: Ban, description: 'Position closed' },
};

/** All statuses in enum order. */
export const ALL_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'UNDER_REVIEW',
  'ASSESSMENT',
  'RECRUITER_CONTACT',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'CLOSED',
];

/** Forward pipeline (non-terminal + offer). */
export const PIPELINE_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'UNDER_REVIEW',
  'ASSESSMENT',
  'RECRUITER_CONTACT',
  'INTERVIEW',
  'OFFER',
];

export const TERMINAL_STATUSES: ApplicationStatus[] = ['REJECTED', 'WITHDRAWN', 'CLOSED'];

export const isTerminal = (s: ApplicationStatus) => TERMINAL_STATUSES.includes(s);
export const isActive = (s: ApplicationStatus) => !isTerminal(s);

export const pipelineIndex = (s: ApplicationStatus) => PIPELINE_STATUSES.indexOf(s);

export const statusLabel = (s: ApplicationStatus | null | undefined) => (s ? STATUS_META[s].label : '—');

export function isApplicationStatus(v: string): v is ApplicationStatus {
  return (ALL_STATUSES as string[]).includes(v);
}

export const CompletedIcon = CheckCircle2;
export const CurrentIcon = CircleDot;

export const BUCKET_META: Record<ApplicationBucket, { label: string; statuses?: ApplicationStatus[] }> = {
  all: { label: 'All' },
  active: { label: 'Active' },
  interviews: { label: 'Interviews', statuses: ['INTERVIEW'] },
  offers: { label: 'Offers', statuses: ['OFFER'] },
  rejected: { label: 'Rejected', statuses: ['REJECTED'] },
  waiting: { label: 'Waiting for response', statuses: ['APPLIED', 'UNDER_REVIEW'] },
};

export const ALL_BUCKETS = Object.keys(BUCKET_META) as ApplicationBucket[];
export function isBucket(v: string): v is ApplicationBucket {
  return (ALL_BUCKETS as string[]).includes(v);
}
