import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  LinkItem,
  ClickLog,
  OverviewStats,
  CreateLinkInput,
  UpdateLinkInput,
  MetaEffectiveStatus,
  MetaAdTracking
} from '../src/types.js';
import { isMetaCrawlerUserAgent } from './metaService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'links.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

export const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'assets',
  'r',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'index.html',
  'vite',
  '@vite',
  '@fs',
  '@id',
  'src',
  'node_modules',
  'public'
]);

interface DatabaseSchema {
  version: number;
  updatedAt: string;
  links: Record<string, LinkItem>;
}

class Store {
  private links: Map<string, LinkItem> = new Map();
  private clickLogs: ClickLog[] = [];
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        if (parsed && parsed.links) {
          for (const [slug, item] of Object.entries(parsed.links)) {
            this.links.set(slug.toLowerCase(), item);
          }
        }
      } else {
        // Pre-seed default links as requested: link1
        this.seedDefaults();
      }

      if (fs.existsSync(LOGS_FILE)) {
        const rawLogs = fs.readFileSync(LOGS_FILE, 'utf-8');
        const parsedLogs = JSON.parse(rawLogs);
        if (Array.isArray(parsedLogs)) {
          this.clickLogs = parsedLogs.slice(-3000); // keep last 3000 in memory
        }
      }
    } catch (err) {
      console.error('[Store] Error during initialization:', err);
      this.seedDefaults();
    }
  }

  private seedDefaults() {
    const now = new Date().toISOString();
    const defaultLinks: LinkItem[] = [
      {
        id: 'link1',
        slug: 'link1',
        targetUrl: '/Nmax Winner Munti Disclaimer.mp4',
        title: 'Nmax Winner Munti Official Link',
        description: 'Permanent dynamic link para sa Nmax Winner Munti Campaign',
        redirectType: 302,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        clickCount: 0,
        tags: ['nmax-winner', 'campaign'],
        forwardQueryParams: true,
        metaTracking: {
          enabled: true,
          adId: '',
          effectiveStatus: 'NOT_CONFIGURED',
          autoSwitchOnActive: false,
          safePageUrl: '/Nmax Winner Munti Disclaimer.mp4',
          moneyPageUrl: '',
          botVisited: false,
          botVisitCount: 0
        }
      }
    ];

    for (const item of defaultLinks) {
      this.links.set(item.slug.toLowerCase(), item);
    }
    this.clickLogs = [];
    this.flushToDisk();
  }

  public clearDemoMode(): void {
    const now = new Date().toISOString();
    this.links.clear();
    this.clickLogs = [];

    const cleanLink: LinkItem = {
      id: 'link1',
      slug: 'link1',
      targetUrl: '/Nmax Winner Munti Disclaimer.mp4',
      title: 'Nmax Winner Munti Official Link',
      description: 'Permanent dynamic link para sa Nmax Winner Munti Campaign',
      redirectType: 302,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      clickCount: 0,
      tags: ['nmax-winner', 'campaign'],
      forwardQueryParams: true,
      metaTracking: {
        enabled: true,
        adId: '',
        effectiveStatus: 'NOT_CONFIGURED',
        autoSwitchOnActive: false,
        safePageUrl: '/Nmax Winner Munti Disclaimer.mp4',
        moneyPageUrl: '',
        botVisited: false,
        botVisitCount: 0
      }
    };

    this.links.set('link1', cleanLink);
    this.flushToDisk();
  }

  public clearAllLinks(): void {
    this.links.clear();
    this.clickLogs = [];
    this.flushToDisk();
  }

  public clearAllLogs(): void {
    this.clickLogs = [];
    for (const link of this.links.values()) {
      link.clickCount = 0;
      link.lastClickedAt = undefined;
      if (link.metaTracking) {
        link.metaTracking.botVisited = false;
        link.metaTracking.botVisitCount = 0;
        link.metaTracking.lastBotVisitAt = undefined;
        link.metaTracking.botReviewLog = undefined;
      }
    }
    this.flushToDisk();
  }

  private flushToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const payload: DatabaseSchema = {
        version: 2,
        updatedAt: new Date().toISOString(),
        links: Object.fromEntries(this.links)
      };

      // Atomic write pattern via temp file
      const tempFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempFile, DATA_FILE);

      // Save logs asynchronously debounced
      if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = setTimeout(() => {
        try {
          const tempLogs = `${LOGS_FILE}.tmp`;
          fs.writeFileSync(tempLogs, JSON.stringify(this.clickLogs.slice(-3000), null, 2), 'utf-8');
          fs.renameSync(tempLogs, LOGS_FILE);
        } catch (logErr) {
          console.error('[Store] Failed to write click logs:', logErr);
        }
      }, 500);
    } catch (err) {
      console.error('[Store] Failed to write links to disk:', err);
    }
  }

  public getAllLinks(): LinkItem[] {
    return Array.from(this.links.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getLink(slug: string): LinkItem | null {
    if (!slug) return null;
    return this.links.get(slug.toLowerCase().trim()) || null;
  }

  public isSlugAvailable(slug: string): boolean {
    const cleanSlug = slug.toLowerCase().trim();
    if (!cleanSlug || RESERVED_SLUGS.has(cleanSlug)) return false;
    return !this.links.has(cleanSlug);
  }

  public createLink(input: CreateLinkInput): LinkItem {
    const slug = input.slug.toLowerCase().trim();

    if (!slug) {
      throw new Error('Slug is required');
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
      throw new Error('Slug can only contain letters, numbers, hyphens, and underscores');
    }
    if (RESERVED_SLUGS.has(slug)) {
      throw new Error(`The slug "${slug}" is a reserved system path`);
    }
    if (this.links.has(slug)) {
      throw new Error(`The slug "${slug}" already exists`);
    }

    let targetUrl = input.targetUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl) && !targetUrl.startsWith('/')) {
      targetUrl = `https://${targetUrl}`;
    }

    const now = new Date().toISOString();

    let metaTracking: MetaAdTracking | undefined = undefined;
    if (input.metaTracking && input.metaTracking.enabled) {
      metaTracking = {
        enabled: true,
        adId: input.metaTracking.adId?.trim() || '',
        accessToken: input.metaTracking.accessToken?.trim() || '',
        effectiveStatus: input.metaTracking.effectiveStatus || 'PENDING_REVIEW',
        autoSwitchOnActive: input.metaTracking.autoSwitchOnActive ?? false,
        safePageUrl: input.metaTracking.safePageUrl?.trim() || '',
        moneyPageUrl: input.metaTracking.moneyPageUrl?.trim() || targetUrl,
        botVisited: false,
        botVisitCount: 0
      };
    }

    const newLink: LinkItem = {
      id: `lnk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      slug,
      targetUrl,
      title: input.title?.trim() || slug,
      description: input.description?.trim() || '',
      redirectType: input.redirectType || 302,
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      clickCount: 0,
      tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : [],
      forwardQueryParams: input.forwardQueryParams ?? true,
      metaTracking
    };

    this.links.set(slug, newLink);
    this.flushToDisk();
    return newLink;
  }

  public updateLink(slug: string, updates: UpdateLinkInput): LinkItem {
    const cleanSlug = slug.toLowerCase().trim();
    const existing = this.links.get(cleanSlug);
    if (!existing) {
      throw new Error(`Link "${slug}" not found`);
    }

    let targetUrl = updates.targetUrl !== undefined ? updates.targetUrl.trim() : existing.targetUrl;
    if (updates.targetUrl !== undefined && !/^https?:\/\//i.test(targetUrl) && !targetUrl.startsWith('/')) {
      targetUrl = `https://${targetUrl}`;
    }

    let metaTracking = existing.metaTracking;
    if (updates.metaTracking !== undefined) {
      if (updates.metaTracking.enabled) {
        metaTracking = {
          enabled: true,
          adId: updates.metaTracking.adId !== undefined ? updates.metaTracking.adId.trim() : existing.metaTracking?.adId || '',
          accessToken: updates.metaTracking.accessToken !== undefined ? updates.metaTracking.accessToken.trim() : existing.metaTracking?.accessToken,
          effectiveStatus: updates.metaTracking.effectiveStatus || existing.metaTracking?.effectiveStatus || 'NOT_CONFIGURED',
          lastCheckedAt: updates.metaTracking.lastCheckedAt || existing.metaTracking?.lastCheckedAt,
          statusDetails: updates.metaTracking.statusDetails || existing.metaTracking?.statusDetails,
          autoSwitchOnActive: updates.metaTracking.autoSwitchOnActive !== undefined ? updates.metaTracking.autoSwitchOnActive : existing.metaTracking?.autoSwitchOnActive || false,
          safePageUrl: updates.metaTracking.safePageUrl !== undefined ? updates.metaTracking.safePageUrl.trim() : existing.metaTracking?.safePageUrl,
          moneyPageUrl: updates.metaTracking.moneyPageUrl !== undefined ? updates.metaTracking.moneyPageUrl.trim() : existing.metaTracking?.moneyPageUrl,
          botVisited: existing.metaTracking?.botVisited ?? false,
          botVisitCount: existing.metaTracking?.botVisitCount ?? 0,
          lastBotVisitAt: existing.metaTracking?.lastBotVisitAt,
          botReviewLog: existing.metaTracking?.botReviewLog
        };
      } else {
        metaTracking = {
          enabled: false,
          botVisited: existing.metaTracking?.botVisited ?? false,
          botVisitCount: existing.metaTracking?.botVisitCount ?? 0
        };
      }
    }

    const updated: LinkItem = {
      ...existing,
      targetUrl,
      title: updates.title !== undefined ? updates.title.trim() : existing.title,
      description: updates.description !== undefined ? updates.description.trim() : existing.description,
      redirectType: updates.redirectType !== undefined ? updates.redirectType : existing.redirectType,
      isActive: updates.isActive !== undefined ? updates.isActive : existing.isActive,
      tags: updates.tags !== undefined ? updates.tags : existing.tags,
      forwardQueryParams: updates.forwardQueryParams !== undefined ? updates.forwardQueryParams : existing.forwardQueryParams,
      metaTracking,
      updatedAt: new Date().toISOString()
    };

    this.links.set(cleanSlug, updated);
    this.flushToDisk();
    return updated;
  }

  public updateMetaStatus(
    slug: string,
    status: MetaEffectiveStatus,
    details?: string
  ): LinkItem {
    const cleanSlug = slug.toLowerCase().trim();
    const existing = this.links.get(cleanSlug);
    if (!existing) {
      throw new Error(`Link "${slug}" not found`);
    }

    const now = new Date().toISOString();
    const prevTracking = existing.metaTracking || {
      enabled: true,
      botVisited: false,
      botVisitCount: 0
    };

    existing.metaTracking = {
      ...prevTracking,
      enabled: true,
      effectiveStatus: status,
      lastCheckedAt: now,
      statusDetails: details || undefined
    };

    // If autoSwitchOnActive is true and status is ACTIVE, ensure targetUrl points to moneyPageUrl
    if (existing.metaTracking.autoSwitchOnActive && status === 'ACTIVE') {
      if (existing.metaTracking.moneyPageUrl) {
        existing.targetUrl = existing.metaTracking.moneyPageUrl;
      }
    } else if (existing.metaTracking.autoSwitchOnActive && status === 'PENDING_REVIEW') {
      if (existing.metaTracking.safePageUrl) {
        existing.targetUrl = existing.metaTracking.safePageUrl;
      }
    }

    existing.updatedAt = now;
    this.links.set(cleanSlug, existing);
    this.flushToDisk();
    return existing;
  }

  public deleteLink(slug: string): boolean {
    const cleanSlug = slug.toLowerCase().trim();
    if (!this.links.has(cleanSlug)) return false;
    this.links.delete(cleanSlug);
    // Also remove logs for this slug
    this.clickLogs = this.clickLogs.filter((log) => log.slug !== cleanSlug);
    this.flushToDisk();
    return true;
  }

  public resetStats(slug: string): LinkItem {
    const cleanSlug = slug.toLowerCase().trim();
    const existing = this.links.get(cleanSlug);
    if (!existing) {
      throw new Error(`Link "${slug}" not found`);
    }

    existing.clickCount = 0;
    existing.lastClickedAt = undefined;
    if (existing.metaTracking) {
      existing.metaTracking.botVisited = false;
      existing.metaTracking.botVisitCount = 0;
      existing.metaTracking.lastBotVisitAt = undefined;
      existing.metaTracking.botReviewLog = undefined;
    }
    this.clickLogs = this.clickLogs.filter((log) => log.slug !== cleanSlug);
    this.flushToDisk();
    return existing;
  }

  /**
   * Records a click or crawler visit.
   * Handles Meta Crawler detection (facebookexternalhit, Facebot, etc.)
   * Saves: [Meta Bot Reviewed Link - Date/Time]
   */
  public recordClick(
    slug: string,
    meta: {
      referer?: string;
      userAgent?: string;
      ip?: string;
    }
  ): { isMetaCrawler: boolean; reviewLog?: string } {
    const cleanSlug = slug.toLowerCase().trim();
    const link = this.links.get(cleanSlug);
    if (!link) return { isMetaCrawler: false };

    const now = new Date().toISOString();
    const formattedDate = now.replace('T', ' ').substring(0, 19);
    link.clickCount = (link.clickCount || 0) + 1;
    link.lastClickedAt = now;

    const ua = meta.userAgent || '';
    const isMeta = isMetaCrawlerUserAgent(ua);

    let reviewLog: string | undefined = undefined;
    if (isMeta) {
      reviewLog = `[Meta Bot Reviewed Link - ${formattedDate}]`;
      if (!link.metaTracking) {
        link.metaTracking = {
          enabled: true,
          botVisited: true,
          botVisitCount: 1,
          lastBotVisitAt: now,
          botReviewLog: reviewLog
        };
      } else {
        link.metaTracking.botVisited = true;
        link.metaTracking.botVisitCount = (link.metaTracking.botVisitCount || 0) + 1;
        link.metaTracking.lastBotVisitAt = now;
        link.metaTracking.botReviewLog = reviewLog;
      }
    }

    // Determine device
    const lowerUa = ua.toLowerCase();
    let device: ClickLog['device'] = 'desktop';
    if (isMeta) {
      device = 'meta_bot';
    } else if (/tablet|ipad|playbook|silk/i.test(lowerUa)) {
      device = 'tablet';
    } else if (/mobile|iphone|android|touch|webos|hpwos/i.test(lowerUa)) {
      device = 'mobile';
    } else if (/bot|crawler|spider|curl|wget|postman/i.test(lowerUa)) {
      device = 'bot';
    }

    let browser = 'Unknown';
    if (isMeta) browser = 'facebookexternalhit (Meta Crawler)';
    else if (lowerUa.includes('chrome') && !lowerUa.includes('edg')) browser = 'Chrome';
    else if (lowerUa.includes('safari') && !lowerUa.includes('chrome')) browser = 'Safari';
    else if (lowerUa.includes('firefox')) browser = 'Firefox';
    else if (lowerUa.includes('edg')) browser = 'Edge';
    else if (lowerUa.includes('bot')) browser = 'Bot/Crawler';

    let os = 'Other';
    if (isMeta) os = 'Meta Ad Review Service';
    else if (lowerUa.includes('win')) os = 'Windows';
    else if (lowerUa.includes('mac')) os = 'macOS';
    else if (lowerUa.includes('android')) os = 'Android';
    else if (lowerUa.includes('iphone') || lowerUa.includes('ipad')) os = 'iOS';
    else if (lowerUa.includes('linux')) os = 'Linux';

    // Mask IP
    const rawIp = meta.ip || '';
    const ipMasked = rawIp.includes('.')
      ? rawIp.replace(/\.\d+$/, '.xxx')
      : rawIp.slice(0, 10) + '...';

    // Parse referrer
    let refererDomain = 'Direct / Meta Ad Platform';
    if (meta.referer && meta.referer !== 'Direct') {
      try {
        const urlObj = new URL(meta.referer);
        refererDomain = urlObj.hostname.replace(/^www\./, '');
      } catch {
        refererDomain = meta.referer;
      }
    }

    const logEntry: ClickLog = {
      id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      slug: cleanSlug,
      timestamp: now,
      referer: refererDomain,
      device,
      browser,
      os,
      ipMasked,
      isMetaCrawler: isMeta,
      crawlerNote: isMeta ? reviewLog : undefined
    };

    this.clickLogs.push(logEntry);
    if (this.clickLogs.length > 3000) {
      this.clickLogs.shift();
    }

    this.flushToDisk();
    return { isMetaCrawler: isMeta, reviewLog };
  }

  public getLogsForSlug(slug: string, limit = 50): ClickLog[] {
    const cleanSlug = slug.toLowerCase().trim();
    return this.clickLogs
      .filter((l) => l.slug === cleanSlug)
      .slice(-limit)
      .reverse();
  }

  public getOverviewStats(): OverviewStats {
    const linksList = Array.from(this.links.values());
    const totalLinks = linksList.length;
    const activeLinks = linksList.filter((l) => l.isActive).length;
    const totalClicks = linksList.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    let clicksLast24h = 0;
    let clicksLast7d = 0;
    let metaBotClicks = 0;

    const deviceStats = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      bot: 0,
      meta_bot: 0,
      other: 0
    };

    const referrerCounts: Record<string, number> = {};

    for (const log of this.clickLogs) {
      const logTime = new Date(log.timestamp).getTime();
      if (logTime >= oneDayAgo) clicksLast24h++;
      if (logTime >= sevenDaysAgo) clicksLast7d++;

      if (log.isMetaCrawler) {
        metaBotClicks++;
        deviceStats.meta_bot++;
      } else if (log.device === 'mobile') {
        deviceStats.mobile++;
      } else if (log.device === 'desktop') {
        deviceStats.desktop++;
      } else if (log.device === 'tablet') {
        deviceStats.tablet++;
      } else if (log.device === 'bot') {
        deviceStats.bot++;
      } else {
        deviceStats.other++;
      }

      const ref = log.referer || 'Direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    }

    const topReferrers = Object.entries(referrerCounts)
      .map(([referer, count]) => ({ referer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topLinks = linksList
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, 5)
      .map((l) => ({
        slug: l.slug,
        title: l.title,
        clicks: l.clickCount,
        targetUrl: l.targetUrl
      }));

    return {
      totalLinks,
      activeLinks,
      totalClicks,
      clicksLast24h,
      clicksLast7d,
      metaBotClicks,
      deviceStats,
      topReferrers,
      topLinks
    };
  }

  public exportSqliteScript(): string {
    const lines: string[] = [
      '-- SQLite & PostgreSQL DDL Schema for Dynamic Link Redirection Server with Meta Ads Review Tracker',
      'CREATE TABLE IF NOT EXISTS links (',
      '  id TEXT PRIMARY KEY,',
      '  slug TEXT UNIQUE NOT NULL,',
      '  target_url TEXT NOT NULL,',
      '  title TEXT NOT NULL,',
      '  description TEXT,',
      '  redirect_type INTEGER DEFAULT 302,',
      '  is_active INTEGER DEFAULT 1,',
      '  created_at TEXT NOT NULL,',
      '  updated_at TEXT NOT NULL,',
      '  click_count INTEGER DEFAULT 0,',
      '  tags TEXT,',
      '  meta_ad_id TEXT,',
      '  meta_effective_status TEXT,',
      '  meta_bot_visited INTEGER DEFAULT 0,',
      '  meta_safe_url TEXT,',
      '  meta_money_url TEXT',
      ');',
      '',
      'CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);',
      '',
      '-- Insert current records'
    ];

    for (const link of this.links.values()) {
      const escapedTarget = link.targetUrl.replace(/'/g, "''");
      const escapedTitle = link.title.replace(/'/g, "''");
      const escapedDesc = (link.description || '').replace(/'/g, "''");
      const tagsStr = (link.tags || []).join(',');
      const metaAdId = link.metaTracking?.adId || '';
      const metaStatus = link.metaTracking?.effectiveStatus || '';
      const botVisited = link.metaTracking?.botVisited ? 1 : 0;
      const safeUrl = (link.metaTracking?.safePageUrl || '').replace(/'/g, "''");
      const moneyUrl = (link.metaTracking?.moneyPageUrl || '').replace(/'/g, "''");

      lines.push(
        `INSERT OR REPLACE INTO links (id, slug, target_url, title, description, redirect_type, is_active, created_at, updated_at, click_count, tags, meta_ad_id, meta_effective_status, meta_bot_visited, meta_safe_url, meta_money_url) VALUES ('${link.id}', '${link.slug}', '${escapedTarget}', '${escapedTitle}', '${escapedDesc}', ${link.redirectType}, ${link.isActive ? 1 : 0}, '${link.createdAt}', '${link.updatedAt}', ${link.clickCount}, '${tagsStr}', '${metaAdId}', '${metaStatus}', ${botVisited}, '${safeUrl}', '${moneyUrl}');`
      );
    }

    return lines.join('\n');
  }

  public exportJson(): string {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 2,
      totalLinks: this.links.size,
      links: Object.fromEntries(this.links)
    };
    return JSON.stringify(payload, null, 2);
  }

  public exportCloudflareWorkerScript(): string {
    const staticMap = JSON.stringify(
      Object.fromEntries(
        Array.from(this.links.values()).map((l) => [
          l.slug,
          {
            url: l.targetUrl,
            status: l.redirectType,
            active: l.isActive,
            safeUrl: l.metaTracking?.safePageUrl,
            moneyUrl: l.metaTracking?.moneyPageUrl,
            metaStatus: l.metaTracking?.effectiveStatus
          }
        ])
      ),
      null,
      2
    );

    return `/**
 * Cloudflare Worker with Meta Ads Review Bot Detection & Dynamic Redirection
 * Handles User-Agent: facebookexternalhit and auto-switching!
 */
const DEFAULT_LINKS = ${staticMap};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const slug = url.pathname.replace(/^\\/(r\\/)?/, '').split('/')[0].toLowerCase();
    const userAgent = request.headers.get('user-agent') || '';
    const isMetaCrawler = /facebookexternalhit|facebot|facebookbot/i.test(userAgent);

    if (!slug) {
      return new Response(
        \`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;">
        <h2>Dynamic Redirection Server with Meta Ads Review Tracker</h2>
        <p>Short link: <code>\${url.origin}/link1</code></p>
        </body></html>\`,
        { headers: { 'content-type': 'text/html;charset=UTF-8' } }
      );
    }

    let linkData = null;
    if (env.LINKS_KV) {
      const kvValue = await env.LINKS_KV.get(slug);
      if (kvValue) {
        try {
          linkData = JSON.parse(kvValue);
        } catch {
          linkData = { url: kvValue, status: 302, active: true };
        }
      }
    }

    if (!linkData && DEFAULT_LINKS[slug]) {
      linkData = DEFAULT_LINKS[slug];
    }

    if (!linkData) return new Response('404: Link Not Found', { status: 404 });
    if (linkData.active === false) return new Response('Link paused.', { status: 403 });

    // Review Bot Detection & Safe vs Money page routing
    let destination = linkData.url;
    if (linkData.safeUrl && linkData.moneyUrl) {
      // If Meta Bot visits or Ad is PENDING_REVIEW, serve safe page
      if (isMetaCrawler || linkData.metaStatus === 'PENDING_REVIEW') {
        destination = linkData.safeUrl;
      } else if (linkData.metaStatus === 'ACTIVE') {
        destination = linkData.moneyUrl;
      }
    }

    if (url.search) {
      destination += (destination.includes('?') ? '&' : '?') + url.search.substring(1);
    }

    // Background Meta Crawler visit logging
    if (isMetaCrawler && env.LINKS_KV && ctx?.waitUntil) {
      ctx.waitUntil((async () => {
        const botLog = \`[Meta Bot Reviewed Link - \${new Date().toISOString()}]\`;
        await env.LINKS_KV.put(\`meta_review:\${slug}\`, botLog);
      })());
    }

    return Response.redirect(destination, linkData.status || 302);
  }
};`;
  }
}

export const store = new Store();
