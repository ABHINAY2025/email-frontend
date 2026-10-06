/**
 * ApplyFlow API types — mirrors docs/API_CONTRACT.md exactly.
 * All timestamps are ISO-8601 UTC strings; plain dates are "YYYY-MM-DD"; IDs are numbers.
 * Nullable fields are always present with `null`.
 */

// ---------------------------------------------------------------- 0. Conventions
export interface ApiError {
  status: number;
  error: ApiErrorCode | string;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string> | null;
}

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'IMAP_AUTH_FAILED'
  | 'IMAP_CONNECTION_FAILED'
  | 'IMAP_TIMEOUT'
  | 'MAILBOX_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'SYNC_IN_PROGRESS'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CurrentUser {
  /** For self-registered users this is their email. */
  username: string;
  displayName: string;
  /** null only for the env-bootstrapped admin; may be missing on older backends. */
  email?: string | null;
}

export interface LoginRequest {
  /** Email (case-insensitive) or username. */
  username: string;
  password: string;
}

// ---------------------------------------------------------------- 16. Accounts & onboarding
export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

export interface AuthConfig {
  registrationEnabled: boolean;
}

export interface OnboardingStatus {
  hasEmailAccount: boolean;
  firstSyncCompleted: boolean;
  syncInProgress: boolean;
  hasApplications: boolean;
  dismissed: boolean;
  /** hasEmailAccount && firstSyncCompleted */
  completed: boolean;
}

// ---------------------------------------------------------------- 1. Enums
export type ApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'ASSESSMENT'
  | 'RECRUITER_CONTACT'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CLOSED';

export type EmailClassification =
  | 'APPLICATION_CONFIRMATION'
  | 'APPLICATION_UPDATE'
  | 'RECRUITER_CONTACT'
  | 'ASSESSMENT'
  | 'INTERVIEW_INVITATION'
  | 'INTERVIEW_UPDATE'
  | 'OFFER'
  | 'REJECTION'
  | 'WITHDRAWAL'
  | 'FOLLOW_UP'
  | 'OTHER_JOB_RELATED'
  | 'NOT_JOB_RELATED';

export type EventType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_CONFIRMATION'
  | 'APPLICATION_UPDATE'
  | 'RECRUITER_CONTACT'
  | 'ASSESSMENT'
  | 'INTERVIEW_INVITATION'
  | 'INTERVIEW_UPDATE'
  | 'OFFER'
  | 'REJECTION'
  | 'WITHDRAWAL'
  | 'FOLLOW_UP'
  | 'STATUS_CHANGE'
  | 'NOTE_ADDED'
  | 'EMAIL_RECEIVED';

export type Actor = 'SYSTEM' | 'USER';

export type EmailProvider = 'GMAIL' | 'OUTLOOK' | 'YAHOO' | 'ICLOUD' | 'IMAP' | 'DEMO';

export type SyncStatus = 'CONNECTED' | 'SYNCING' | 'ERROR' | 'DISCONNECTED';

export type SyncJobStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export type CalendarEventType =
  | 'APPLICATION'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'RECRUITER_CALL'
  | 'FOLLOW_UP'
  | 'OFFER'
  | 'DEADLINE'
  | 'REJECTION';

export type NotificationType =
  | 'NEW_INTERVIEW'
  | 'RECRUITER_RESPONSE'
  | 'NEW_OFFER'
  | 'NEW_REJECTION'
  | 'ASSESSMENT_DEADLINE'
  | 'STATUS_CHANGE'
  | 'SYNC_FAILURE'
  | 'POSSIBLE_DUPLICATE';

export type AttentionKind =
  | 'INTERVIEW'
  | 'ASSESSMENT'
  | 'RECRUITER_RESPONSE'
  | 'OFFER'
  | 'FOLLOW_UP'
  | 'POSSIBLE_MATCH'
  | 'NEEDS_REVIEW';

export type InboxTab =
  | 'all'
  | 'attention'
  | 'applications'
  | 'recruiters'
  | 'interviews'
  | 'assessments'
  | 'offers'
  | 'rejected'
  | 'review';

export type ApplicationBucket = 'all' | 'active' | 'interviews' | 'offers' | 'rejected' | 'waiting';

// ---------------------------------------------------------------- 2. Applications
export interface ApplicationSummary {
  id: number;
  displayId: string;
  companyId: number;
  companyName: string;
  companyDomain: string | null;
  jobTitle: string;
  location: string | null;
  source: string | null;
  status: ApplicationStatus;
  appliedAt: string | null;
  lastActivityAt: string | null;
  emailCount: number;
  emailAccountId: number | null;
  emailAccountEmail: string | null;
  provider: EmailProvider | null;
  needsReview: boolean;
  archived: boolean;
}

export interface Note {
  id: number;
  applicationId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  id: number;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actor: Actor;
  reason: string | null;
  emailId: number | null;
  confidence: number | null;
  changedAt: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  jobUrl: string | null;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  applicationRef: string | null;
  currentStage: string | null;
  confidence: number | null;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
  statusHistory: StatusHistoryEntry[];
}

export interface TimelineEvent {
  id: number;
  applicationId: number;
  eventType: EventType;
  title: string;
  description: string | null;
  eventDate: string;
  previousStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus | null;
  confidence: number | null;
  actor: Actor;
  emailId: number | null;
  emailSubject: string | null;
  scheduledAt: string | null;
}

export type ApplicationSort = 'appliedAt' | 'lastActivityAt' | 'company' | 'jobTitle' | 'status';
export type SortDir = 'asc' | 'desc';

export interface ApplicationQuery {
  q?: string;
  bucket?: ApplicationBucket;
  status?: ApplicationStatus[];
  companyId?: number;
  from?: string;
  to?: string;
  location?: string;
  source?: string;
  emailAccountId?: number;
  jobTitle?: string;
  archived?: boolean;
  sort?: ApplicationSort;
  dir?: SortDir;
  page?: number;
  size?: number;
}

export interface CreateApplicationRequest {
  companyName: string;
  jobTitle: string;
  jobUrl?: string | null;
  location?: string | null;
  appliedAt?: string | null;
  source?: string | null;
  status?: ApplicationStatus;
  employmentType?: string | null;
  notes?: string | null;
}

export interface UpdateApplicationRequest {
  companyName?: string;
  jobTitle?: string;
  jobUrl?: string | null;
  location?: string | null;
  appliedAt?: string | null;
  source?: string | null;
  employmentType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  currentStage?: string | null;
  archived?: boolean;
}

export interface UpdateStatusRequest {
  status: ApplicationStatus;
  reason?: string;
}

export interface ApplicationFacets {
  companies: { id: number; name: string }[];
  locations: string[];
  sources: string[];
  emailAccounts: { id: number; email: string }[];
}

// ---------------------------------------------------------------- 3. Emails / Inbox
export interface InboxItem {
  id: number;
  emailAccountId: number | null;
  emailAccountEmail: string | null;
  companyName: string | null;
  senderName: string | null;
  senderEmail: string;
  subject: string;
  snippet: string | null;
  summary: string | null;
  applicationId: number | null;
  applicationJobTitle: string | null;
  classification: EmailClassification;
  detectedStatus: ApplicationStatus | null;
  confidence: number;
  actionRequired: boolean;
  actionText: string | null;
  needsReview: boolean;
  isRead: boolean;
  receivedAt: string;
}

export interface StatusImpact {
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  applied: boolean;
}

export interface MatchSuggestion {
  applicationId: number;
  companyName: string;
  jobTitle: string;
  score: number;
  reason: string;
}

export interface EmailDetail extends InboxItem {
  recipient: string | null;
  threadId: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  classificationReason: string | null;
  statusImpact: StatusImpact | null;
  matchSuggestions: MatchSuggestion[];
}

export interface InboxCounts {
  all: number;
  attention: number;
  applications: number;
  recruiters: number;
  interviews: number;
  assessments: number;
  offers: number;
  rejected: number;
  review: number;
  unread: number;
}

export interface InboxQuery {
  tab?: InboxTab;
  q?: string;
  accountId?: number;
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------- 4. Dashboard
export interface DashboardSummary {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  rejected: number;
  waiting: number;
  pipeline: { status: ApplicationStatus; count: number }[];
  appliedThisWeek: number;
  responseRate: number;
  lastSyncAt: string | null;
}

export interface ActivityItem {
  id: number;
  applicationId: number;
  companyName: string;
  jobTitle: string;
  eventType: EventType;
  title: string;
  description: string | null;
  previousStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus | null;
  actor: Actor;
  occurredAt: string;
}

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  applicationId: number | null;
  emailId: number | null;
  companyName: string;
  jobTitle: string | null;
  reason: string;
  timestamp: string;
  dueAt: string | null;
  actionLabel: string;
}

// ---------------------------------------------------------------- 5. Calendar
export interface CalendarEvent {
  id: string;
  applicationId: number;
  companyName: string;
  jobTitle: string;
  type: CalendarEventType;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  emailId: number | null;
}

// ---------------------------------------------------------------- 6. Companies
export interface CompanySummary {
  id: number;
  name: string;
  domain: string | null;
  applications: number;
  active: number;
  interviews: number;
  offers: number;
  rejected: number;
  latestActivityAt: string | null;
}

export interface Contact {
  id: number;
  name: string | null;
  email: string;
  role: string | null;
  lastContactAt: string | null;
  emailCount: number;
}

/**
 * Note: the contract defines CompanyDetail as `extends CompanySummary` while also declaring
 * `applications: ApplicationSummary[]`, which conflicts with `CompanySummary.applications: number`.
 * The detail payload's `applications` is the list; we Omit the numeric field here.
 */
export interface CompanyDetail extends Omit<CompanySummary, 'applications'> {
  website: string | null;
  statusDistribution: { status: ApplicationStatus; count: number }[];
  applications: ApplicationSummary[];
  recentEmails: InboxItem[];
  contacts: Contact[];
  history: ActivityItem[];
  responseStats: { responseRate: number; avgResponseDays: number | null; totalEmails: number };
}

// ---------------------------------------------------------------- 7. Analytics
export interface AnalyticsOverview {
  totalApplications: number;
  applicationsThisWeek: number;
  applicationsThisMonth: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  rejectionRate: number;
  avgResponseDays: number | null;
  avgDaysToInterview: number | null;
  avgDaysToRejection: number | null;
  funnel: { applied: number; responses: number; interviews: number; offers: number };
}

export interface TimeSeriesPoint {
  periodStart: string;
  label: string;
  count: number;
}

export interface BreakdownItem {
  key: string;
  count: number;
}

export interface ApplicationsAnalytics {
  weekly: TimeSeriesPoint[];
  monthly: TimeSeriesPoint[];
  bySource: BreakdownItem[];
  byCompany: BreakdownItem[];
  byJobTitle: BreakdownItem[];
  byLocation: BreakdownItem[];
}

export interface StatusAnalytics {
  distribution: { status: ApplicationStatus; count: number }[];
}

export interface ResponseRateAnalytics {
  overall: number;
  bySource: { key: string; total: number; responded: number; rate: number }[];
  weekly: { periodStart: string; label: string; rate: number; total: number }[];
}

// ---------------------------------------------------------------- 8. Email accounts
export interface EmailAccount {
  id: number;
  email: string;
  provider: EmailProvider;
  host: string;
  port: number;
  ssl: boolean;
  username: string;
  folder: string;
  syncStatus: SyncStatus;
  enabled: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  emailsProcessed: number;
  jobEmails: number;
  initialSyncDays: number;
  hasPassword: boolean;
  createdAt: string;
}

export interface CreateEmailAccountRequest {
  email: string;
  appPassword: string;
  provider?: EmailProvider;
  host?: string;
  port?: number;
  ssl?: boolean;
  username?: string;
  folder?: string;
  initialSyncDays?: number;
}

export interface UpdateEmailAccountRequest {
  appPassword?: string;
  host?: string;
  port?: number;
  ssl?: boolean;
  username?: string;
  folder?: string;
  initialSyncDays?: number;
  enabled?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------- 9. Sync
export interface SyncJob {
  id: number;
  emailAccountId: number;
  emailAccountEmail: string;
  status: SyncJobStatus;
  startedAt: string;
  finishedAt: string | null;
  messagesFetched: number;
  messagesProcessed: number;
  jobEmailsFound: number;
  applicationsCreated: number;
  applicationsUpdated: number;
  error: string | null;
}

export type SyncState = 'IDLE' | 'SYNCING' | 'ERROR';

export interface SyncAccountStatus {
  accountId: number;
  email: string;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface SyncStatusResponse {
  state: SyncState;
  lastSyncAt: string | null;
  lastError: string | null;
  intervalMinutes: number;
  accounts: SyncAccountStatus[];
  recentJobs: SyncJob[];
}

export interface SyncStartResponse {
  started: number;
}

// ---------------------------------------------------------------- 10. Notifications
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  applicationId: number | null;
  emailId: number | null;
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------- 11. Search
export interface SearchResults {
  applications: ApplicationSummary[];
  emails: InboxItem[];
  companies: CompanySummary[];
}

// ---------------------------------------------------------------- 12. Settings
export interface AppSettings {
  displayName: string;
  syncIntervalMinutes: number;
  defaultInitialSyncDays: number;
  confidenceThreshold: number;
  autoUpdateStatus: boolean;
  followUpDays: number;
}

// ---------------------------------------------------------------- 13. SSE
export type ServerEventType =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_UPDATED'
  | 'STATUS_CHANGED'
  | 'EMAIL_RECEIVED'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED'
  | 'NOTIFICATION_CREATED';

export const SERVER_EVENT_TYPES: ServerEventType[] = [
  'APPLICATION_CREATED',
  'APPLICATION_UPDATED',
  'STATUS_CHANGED',
  'EMAIL_RECEIVED',
  'SYNC_STARTED',
  'SYNC_COMPLETED',
  'SYNC_FAILED',
  'NOTIFICATION_CREATED',
];

export interface StatusChangedPayload {
  applicationId: number;
  companyName: string;
  jobTitle: string;
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  actor: Actor;
}

export interface ServerEventPayloadMap {
  APPLICATION_CREATED: ApplicationSummary;
  APPLICATION_UPDATED: ApplicationSummary;
  STATUS_CHANGED: StatusChangedPayload;
  EMAIL_RECEIVED: InboxItem;
  SYNC_STARTED: SyncJob;
  SYNC_COMPLETED: SyncJob;
  SYNC_FAILED: SyncJob;
  NOTIFICATION_CREATED: Notification;
}

export interface ServerEvent<T extends ServerEventType = ServerEventType> {
  type: T;
  payload: ServerEventPayloadMap[T];
  timestamp: string;
}

// ---------------------------------------------------------------- 14. Health
export interface HealthResponse {
  status: 'UP' | string;
  database: 'UP' | 'DOWN';
  version: string;
}
