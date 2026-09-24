import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { store, RESERVED_SLUGS } from './store.js';
import { checkMetaAdStatus } from './metaService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS & Preflight
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==========================================
// API ROUTER
// ==========================================
const api = express.Router();

// 1. Get all links
api.get('/links', (_req: Request, res: Response) => {
  try {
    const links = store.getAllLinks();
    res.json({ success: true, links });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Check slug availability
api.get('/check-slug/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const available = store.isSlugAvailable(slug);
  res.json({ slug, available });
});

// 3. Get single link + recent logs
api.get('/links/:slug', (req: Request, res: Response) => {
  try {
    const link = store.getLink(req.params.slug);
    if (!link) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    const logs = store.getLogsForSlug(req.params.slug, 50);
    res.json({ success: true, link, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create new link
api.post('/links', (req: Request, res: Response) => {
  try {
    const { slug, targetUrl, title, description, redirectType, isActive, tags, forwardQueryParams, metaTracking } = req.body;
    if (!slug || !targetUrl) {
      return res.status(400).json({ success: false, error: 'Slug at Target URL ay kailangan (required)' });
    }

    const created = store.createLink({
      slug,
      targetUrl,
      title,
      description,
      redirectType: Number(redirectType) as any || 302,
      isActive: isActive !== undefined ? isActive : true,
      tags: Array.isArray(tags) ? tags : [],
      forwardQueryParams: forwardQueryParams !== undefined ? forwardQueryParams : true,
      metaTracking
    });

    res.status(201).json({ success: true, link: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Update existing link (Target URL can be changed anytime!)
api.put('/links/:slug', (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const { targetUrl, title, description, redirectType, isActive, tags, forwardQueryParams, metaTracking } = req.body;

    const updated = store.updateLink(slug, {
      targetUrl,
      title,
      description,
      redirectType: redirectType ? (Number(redirectType) as any) : undefined,
      isActive,
      tags,
      forwardQueryParams,
      metaTracking
    });

    res.json({ success: true, link: updated, message: 'Target URL successfully updated nang hindi nabago ang short link!' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5b. Check Meta Marketing API Status for an Ad ID
api.post('/meta/check-status', async (req: Request, res: Response) => {
  try {
    const { adId, accessToken, slug } = req.body;
    if (!adId) {
      return res.status(400).json({ success: false, error: 'adId is required' });
    }

    const result = await checkMetaAdStatus(adId, accessToken);

    if (slug && result.success && result.effectiveStatus) {
      try {
        store.updateMetaStatus(slug, result.effectiveStatus, result.name);
      } catch (updateErr) {
        console.warn('[Meta] Could not update stored link status:', updateErr);
      }
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5c. Manually simulate or test Meta Crawler visit
api.post('/links/:slug/test-meta-crawler', (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const result = store.recordClick(slug, {
      referer: 'https://l.facebook.com/',
      userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      ip: '31.13.127.1'
    });

    const updated = store.getLink(slug);
    res.json({
      success: true,
      message: 'Simulated Meta Bot review visit recorded',
      reviewLog: result.reviewLog,
      link: updated
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Delete link
api.delete('/links/:slug', (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const deleted = store.deleteLink(slug);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    res.json({ success: true, message: `Short link "${slug}" deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Reset click stats for a link
api.post('/links/:slug/reset', (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const updated = store.resetStats(slug);
    res.json({ success: true, link: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Overview Stats
api.get('/stats/overview', (_req: Request, res: Response) => {
  try {
    const stats = store.getOverviewStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Export formats
api.get('/export/:format', (req: Request, res: Response) => {
  const { format } = req.params;
  if (format === 'json') {
    const links = store.getAllLinks();
    res.setHeader('Content-Disposition', 'attachment; filename="links-backup.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(links, null, 2));
  }

  if (format === 'sqlite') {
    const sql = store.exportSqliteScript();
    res.setHeader('Content-Disposition', 'attachment; filename="schema-and-seed.sql"');
    res.setHeader('Content-Type', 'text/plain');
    return res.send(sql);
  }

  if (format === 'cloudflare') {
    const workerCode = store.exportCloudflareWorkerScript();
    res.setHeader('Content-Disposition', 'attachment; filename="worker.js"');
    res.setHeader('Content-Type', 'application/javascript');
    return res.send(workerCode);
  }

  res.status(400).json({ error: 'Unknown export format. Use json, sqlite, or cloudflare' });
});

// 10. Import JSON
api.post('/import/json', (req: Request, res: Response) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Expected an array of link objects' });
    }

    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.slug || !item.targetUrl) {
        skipped++;
        continue;
      }
      try {
        if (store.getLink(item.slug)) {
          store.updateLink(item.slug, {
            targetUrl: item.targetUrl,
            title: item.title,
            description: item.description,
            redirectType: item.redirectType,
            isActive: item.isActive,
            tags: item.tags
          });
        } else {
          store.createLink({
            slug: item.slug,
            targetUrl: item.targetUrl,
            title: item.title,
            description: item.description,
            redirectType: item.redirectType,
            isActive: item.isActive,
            tags: item.tags
          });
        }
        imported++;
      } catch {
        skipped++;
      }
    }

    res.json({ success: true, imported, skipped, total: items.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Admin: Clear demo mode / reset to clean production state
api.post('/admin/clear-demo', (_req: Request, res: Response) => {
  try {
    store.clearDemoMode();
    res.json({
      success: true,
      message: 'Demo mode cleared! Database is now in clean production state.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Admin: Clear all links
api.post('/admin/clear-all-links', (_req: Request, res: Response) => {
  try {
    store.clearAllLinks();
    res.json({ success: true, message: 'All links deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Admin: Clear all click logs
api.post('/admin/clear-all-logs', (_req: Request, res: Response) => {
  try {
    store.clearAllLogs();
    res.json({ success: true, message: 'All click logs and stats cleared to 0.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use('/api', api);

// Serve files from public folder (e.g., MP4 videos, images)
app.use(express.static(path.resolve(__dirname, '..', 'public')));

// ==========================================
// DYNAMIC LINK REDIRECTION ENGINE
// ==========================================
export const handleRedirect = (slug: string, req: Request, res: Response, next: NextFunction) => {
  const link = store.getLink(slug);
  if (!link) {
    return next();
  }

  // Check if link is paused / disabled
  if (!link.isActive) {
    res.status(403).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Link Paused | ${link.title || slug}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; background: #7f1d1d; color: #fca5a5; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
          h1 { font-size: 24px; margin: 0 0 12px; color: #ffffff; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
          .slug-box { background: #0f172a; padding: 10px; border-radius: 8px; font-family: monospace; color: #38bdf8; margin-bottom: 24px; word-break: break-all; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; }
          .btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Naka-Pause ang Link (Paused)</div>
          <h1>Ang Link na ito ay pansamantalang hindi aktibo</h1>
          <div class="slug-box">/${slug}</div>
          <p>Pansamantalang sinuspinde o naka-off ang redirection para sa link na ito ng may-ari ng website (Admin). Mangyaring bumalik muli mamaya.</p>
          <a href="/" class="btn">Pumunta sa Admin Dashboard</a>
        </div>
      </body>
      </html>
    `);
  }

  // Record click analytics and detect Meta Crawler
  const referer = (req.headers['referer'] || req.headers['referrer'] || 'Direct') as string;
  const userAgent = (req.headers['user-agent'] || 'Unknown') as string;
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'Unknown';

  const clickResult = store.recordClick(slug, {
    referer,
    userAgent,
    ip
  });

  let destinationUrl = link.targetUrl;

  if (link.metaTracking?.enabled) {
    const { safePageUrl, moneyPageUrl, autoSwitchOnActive, effectiveStatus } = link.metaTracking;

    if (clickResult.isMetaCrawler && safePageUrl) {
      destinationUrl = safePageUrl;
    } else if (autoSwitchOnActive && safePageUrl && moneyPageUrl) {
      if (effectiveStatus === 'ACTIVE') {
        destinationUrl = moneyPageUrl;
      } else if (effectiveStatus === 'PENDING_REVIEW' || !effectiveStatus) {
        destinationUrl = safePageUrl;
      }
    }
  }

  if (link.forwardQueryParams) {
    const queryIdx = req.url.indexOf('?');
    if (queryIdx !== -1) {
      const queryStr = req.url.substring(queryIdx + 1);
      if (queryStr) {
        destinationUrl += (destinationUrl.includes('?') ? '&' : '?') + queryStr;
      }
    }
  }

  const statusCode = Number(link.redirectType) || 302;
  res.setHeader('X-Redirect-By', 'Dynamic-Link-Server-Meta-Review');
  if (clickResult.isMetaCrawler) {
    res.setHeader('X-Meta-Review-Detected', 'true');
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return res.redirect(statusCode, destinationUrl);
};

// Explicit /r/:slug route
app.get('/r/:slug', (req: Request, res: Response, next: NextFunction) => {
  const slug = req.params.slug;
  handleRedirect(slug, req, res, next);
});

// Direct root /:slug route (e.g. domain.com/link1)
app.get('/:slug', (req: Request, res: Response, next: NextFunction) => {
  const slug = req.params.slug;

  if (
    !slug ||
    slug.includes('.') ||
    slug.startsWith('@') ||
    RESERVED_SLUGS.has(slug.toLowerCase())
  ) {
    return next();
  }

  handleRedirect(slug, req, res, next);
});

// Production SPA fallback (if dist/ exists)
const distDir = path.resolve(__dirname, '..', 'dist');
const distIndex = path.join(distDir, 'index.html');

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  next();
});

export default app;
