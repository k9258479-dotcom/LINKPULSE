export type MetaEffectiveStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'PENDING_REVIEW'
  | 'DISAPPROVED'
  | 'PREAPPROVED'
  | 'CAMPAIGN_PAUSED'
  | 'ARCHIVED'
  | 'DELETED'
  | 'UNKNOWN'
  | 'NOT_CONFIGURED';

export interface MetaBotVisit {
  lastVisitedAt: string;
  count: number;
  lastUserAgent: string;
  lastIp: string;
}

export interface MetaAdTracking {
  enabled: boolean;
  adId?: string;
  accessToken?: string; // Optional per-link or falls back to system token
  effectiveStatus?: MetaEffectiveStatus;
  lastCheckedAt?: string;
  statusDetails?: string;

  // Auto-Redirect / Cloaking / Review switch rule:
  // When pending review, redirect to safePageUrl (Link A).
  // Once active/approved, automatically switch or route to moneyPageUrl (Link B).
  autoSwitchOnActive?: boolean;
  safePageUrl?: string;     // Link A (Safe White-Hat / Informational Page)
  moneyPageUrl?: string;    // Link B (Offer / Conversion / Target Page)

  // Bot inspection info
  botVisited: boolean;
  botVisitCount: number;
  lastBotVisitAt?: string;
  botReviewLog?: string; // e.g. "[Meta Bot Reviewed Link - 2026-09-22 23:05:00]"
}

export interface LinkItem {
  id: string;
  slug: string;          // e.g. "link1"
  targetUrl: string;     // destination URL
  title: string;         // human-readable label
  description?: string;
  redirectType: 301 | 302 | 307 | 308;
  isActive: boolean;
  createdAt: string;     // ISO date
  updatedAt: string;     // ISO date
  clickCount: number;
  lastClickedAt?: string;
  tags: string[];
  forwardQueryParams: boolean;

  // Meta Ads Review Tracker
  metaTracking?: MetaAdTracking;
}

export interface ClickLog {
  id: string;
  slug: string;
  timestamp: string;
  referer: string;
  device: 'mobile' | 'desktop' | 'tablet' | 'bot' | 'meta_bot' | 'other';
  browser: string;
  os: string;
  ipMasked: string;
  isMetaCrawler?: boolean;
  crawlerNote?: string;
}

export interface OverviewStats {
  totalLinks: number;
  activeLinks: number;
  totalClicks: number;
  clicksLast24h: number;
  clicksLast7d: number;
  metaBotClicks: number;
  deviceStats: {
    mobile: number;
    desktop: number;
    tablet: number;
    bot: number;
    meta_bot: number;
    other: number;
  };
  topReferrers: { referer: string; count: number }[];
  topLinks: { slug: string; title: string; clicks: number; targetUrl: string }[];
}

export interface CreateLinkInput {
  slug: string;
  targetUrl: string;
  title?: string;
  description?: string;
  redirectType?: 301 | 302 | 307 | 308;
  isActive?: boolean;
  tags?: string[];
  forwardQueryParams?: boolean;

  // Meta Ads Review Fields
  metaTracking?: Partial<MetaAdTracking>;
}

export interface UpdateLinkInput {
  targetUrl?: string;
  title?: string;
  description?: string;
  redirectType?: 301 | 302 | 307 | 308;
  isActive?: boolean;
  tags?: string[];
  forwardQueryParams?: boolean;

  // Meta Ads Review Fields
  metaTracking?: Partial<MetaAdTracking>;
}
