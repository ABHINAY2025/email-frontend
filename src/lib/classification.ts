import {
  AlarmClock,
  Ban,
  Bell,
  Briefcase,
  CalendarClock,
  CalendarPlus,
  ClipboardList,
  FileCheck2,
  FileText,
  Flag,
  GitMerge,
  Inbox,
  type LucideIcon,
  Mail,
  MessagesSquare,
  PhoneCall,
  RefreshCw,
  Send,
  StickyNote,
  Trophy,
  TriangleAlert,
  Undo2,
  UserRound,
  XCircle,
  Eye,
} from 'lucide-react';
import type {
  AttentionKind,
  CalendarEventType,
  EmailClassification,
  EmailProvider,
  EventType,
  InboxTab,
  NotificationType,
  SyncStatus,
} from '@/types/api';
import type { HueName } from './status';

interface Meta {
  label: string;
  hue: HueName;
  icon: LucideIcon;
}

export const CLASSIFICATION_META: Record<EmailClassification, Meta> = {
  APPLICATION_CONFIRMATION: { label: 'Confirmation', hue: 'slate', icon: FileCheck2 },
  APPLICATION_UPDATE: { label: 'Update', hue: 'blue', icon: RefreshCw },
  RECRUITER_CONTACT: { label: 'Recruiter', hue: 'teal', icon: PhoneCall },
  ASSESSMENT: { label: 'Assessment', hue: 'violet', icon: ClipboardList },
  INTERVIEW_INVITATION: { label: 'Interview invite', hue: 'amber', icon: CalendarPlus },
  INTERVIEW_UPDATE: { label: 'Interview update', hue: 'amber', icon: MessagesSquare },
  OFFER: { label: 'Offer', hue: 'green', icon: Trophy },
  REJECTION: { label: 'Rejection', hue: 'red', icon: XCircle },
  WITHDRAWAL: { label: 'Withdrawal', hue: 'gray', icon: Undo2 },
  FOLLOW_UP: { label: 'Follow-up', hue: 'indigo', icon: AlarmClock },
  OTHER_JOB_RELATED: { label: 'Job related', hue: 'gray', icon: Briefcase },
  NOT_JOB_RELATED: { label: 'Not job related', hue: 'gray', icon: Ban },
};

export const ALL_CLASSIFICATIONS = Object.keys(CLASSIFICATION_META) as EmailClassification[];

export const EVENT_META: Record<EventType, Meta> = {
  APPLICATION_SUBMITTED: { label: 'Application submitted', hue: 'slate', icon: Send },
  APPLICATION_CONFIRMATION: { label: 'Confirmation received', hue: 'slate', icon: FileCheck2 },
  APPLICATION_UPDATE: { label: 'Application update', hue: 'blue', icon: RefreshCw },
  RECRUITER_CONTACT: { label: 'Recruiter contact', hue: 'teal', icon: PhoneCall },
  ASSESSMENT: { label: 'Assessment', hue: 'violet', icon: ClipboardList },
  INTERVIEW_INVITATION: { label: 'Interview invitation', hue: 'amber', icon: CalendarPlus },
  INTERVIEW_UPDATE: { label: 'Interview update', hue: 'amber', icon: MessagesSquare },
  OFFER: { label: 'Offer', hue: 'green', icon: Trophy },
  REJECTION: { label: 'Rejection', hue: 'red', icon: XCircle },
  WITHDRAWAL: { label: 'Withdrawal', hue: 'gray', icon: Undo2 },
  FOLLOW_UP: { label: 'Follow-up', hue: 'indigo', icon: AlarmClock },
  STATUS_CHANGE: { label: 'Status change', hue: 'indigo', icon: GitMerge },
  NOTE_ADDED: { label: 'Note added', hue: 'gray', icon: StickyNote },
  EMAIL_RECEIVED: { label: 'Email received', hue: 'gray', icon: Mail },
};

export const CALENDAR_TYPE_META: Record<CalendarEventType, Meta> = {
  APPLICATION: { label: 'Application', hue: 'slate', icon: Send },
  ASSESSMENT: { label: 'Assessment', hue: 'violet', icon: ClipboardList },
  INTERVIEW: { label: 'Interview', hue: 'amber', icon: MessagesSquare },
  RECRUITER_CALL: { label: 'Recruiter call', hue: 'teal', icon: PhoneCall },
  FOLLOW_UP: { label: 'Follow-up', hue: 'indigo', icon: AlarmClock },
  OFFER: { label: 'Offer', hue: 'green', icon: Trophy },
  DEADLINE: { label: 'Deadline', hue: 'orange', icon: Flag },
  REJECTION: { label: 'Rejection', hue: 'red', icon: XCircle },
};

export const ALL_CALENDAR_TYPES = Object.keys(CALENDAR_TYPE_META) as CalendarEventType[];

export const ATTENTION_META: Record<AttentionKind, Meta> = {
  INTERVIEW: { label: 'Interview', hue: 'amber', icon: CalendarClock },
  ASSESSMENT: { label: 'Assessment', hue: 'violet', icon: ClipboardList },
  RECRUITER_RESPONSE: { label: 'Recruiter', hue: 'teal', icon: UserRound },
  OFFER: { label: 'Offer', hue: 'green', icon: Trophy },
  FOLLOW_UP: { label: 'Follow-up', hue: 'indigo', icon: AlarmClock },
  POSSIBLE_MATCH: { label: 'Possible match', hue: 'orange', icon: GitMerge },
  NEEDS_REVIEW: { label: 'Needs review', hue: 'orange', icon: Eye },
};

export const NOTIFICATION_META: Record<NotificationType, Meta> = {
  NEW_INTERVIEW: { label: 'Interview', hue: 'amber', icon: CalendarPlus },
  RECRUITER_RESPONSE: { label: 'Recruiter', hue: 'teal', icon: PhoneCall },
  NEW_OFFER: { label: 'Offer', hue: 'green', icon: Trophy },
  NEW_REJECTION: { label: 'Rejection', hue: 'red', icon: XCircle },
  ASSESSMENT_DEADLINE: { label: 'Assessment', hue: 'violet', icon: AlarmClock },
  STATUS_CHANGE: { label: 'Status', hue: 'indigo', icon: GitMerge },
  SYNC_FAILURE: { label: 'Sync failed', hue: 'red', icon: TriangleAlert },
  POSSIBLE_DUPLICATE: { label: 'Possible duplicate', hue: 'orange', icon: GitMerge },
};

export const INBOX_TABS: { value: InboxTab; label: string; icon: LucideIcon }[] = [
  { value: 'all', label: 'All', icon: Inbox },
  { value: 'attention', label: 'Requires Attention', icon: Bell },
  { value: 'applications', label: 'Applications', icon: FileText },
  { value: 'recruiters', label: 'Recruiters', icon: PhoneCall },
  { value: 'interviews', label: 'Interviews', icon: MessagesSquare },
  { value: 'assessments', label: 'Assessments', icon: ClipboardList },
  { value: 'offers', label: 'Offers', icon: Trophy },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
  { value: 'review', label: 'Needs Review', icon: Eye },
];

export function isInboxTab(v: string | null): v is InboxTab {
  return !!v && INBOX_TABS.some((t) => t.value === v);
}

export const PROVIDER_META: Record<EmailProvider, { label: string; hue: HueName; imapHost: string }> = {
  GMAIL: { label: 'Gmail', hue: 'red', imapHost: 'imap.gmail.com' },
  OUTLOOK: { label: 'Outlook', hue: 'blue', imapHost: 'outlook.office365.com' },
  YAHOO: { label: 'Yahoo', hue: 'violet', imapHost: 'imap.mail.yahoo.com' },
  ICLOUD: { label: 'iCloud', hue: 'slate', imapHost: 'imap.mail.me.com' },
  IMAP: { label: 'IMAP', hue: 'gray', imapHost: '' },
  DEMO: { label: 'Demo', hue: 'indigo', imapHost: '' },
};

export const ALL_PROVIDERS = Object.keys(PROVIDER_META) as EmailProvider[];

export function detectProvider(email: string): EmailProvider {
  const domain = email.split('@')[1]?.toLowerCase().trim() ?? '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'GMAIL';
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) return 'OUTLOOK';
  if (/^yahoo\./.test(domain) || domain === 'ymail.com') return 'YAHOO';
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') return 'ICLOUD';
  return 'IMAP';
}

export const SYNC_STATUS_META: Record<SyncStatus, { label: string; hue: HueName }> = {
  CONNECTED: { label: 'Connected', hue: 'green' },
  SYNCING: { label: 'Syncing', hue: 'blue' },
  ERROR: { label: 'Error', hue: 'red' },
  DISCONNECTED: { label: 'Disconnected', hue: 'gray' },
};

export const SYNC_WINDOW_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 180 days' },
  { value: 365, label: 'Last 365 days' },
  { value: 0, label: 'All available' },
];

export function syncWindowLabel(days: number) {
  return SYNC_WINDOW_OPTIONS.find((o) => o.value === days)?.label ?? `Last ${days} days`;
}
