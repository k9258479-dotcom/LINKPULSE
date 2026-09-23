import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { store, RESERVED_SLUGS } from './server/store.js';
import { checkMetaAdStatus, isMetaCrawlerUserAgent } from './server/metaService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger for debugging
  app.use((req, res, next) => {
    if (!req.url.startsWith('/@') && !req.url.startsWith('/src') && !req.url.startsWith('/node_modules')) {
      // console.log(`[HTTP] ${req.method} ${req.url}`);
    }
    next();
  });

  // ==========================================
  // API ROUTER
  // ==========================================
  const api = express.Router();

  // 1. Get all links
  api.get('/links', (req: Request, res: Response) => {
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

      // If a slug was passed and check was successful, update the store directly
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

  // 5c. Manually simulate or test Meta Crawler visit (for QA testing)
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
  api.get('/stats/overview', (req: Request, res: Response) => {
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
            // Update existing
            store.updateLink(item.slug, {
              targetUrl: item.targetUrl,
              title: item.title,
              description: item.description,
              redirectType: item.redirectType,
              isActive: item.isActive,
              tags: item.tags
            });
          } else {
            // Create new
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

  // 13. Admin: Clear demo mode / reset to clean production state
  api.post('/admin/clear-demo', (req: Request, res: Response) => {
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

  // 14. Admin: Clear all links
  api.post('/admin/clear-all-links', (req: Request, res: Response) => {
    try {
      store.clearAllLinks();
      res.json({ success: true, message: 'All links deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 15. Admin: Clear all click logs
  api.post('/admin/clear-all-logs', (req: Request, res: Response) => {
    try {
      store.clearAllLogs();
      res.json({ success: true, message: 'All click logs and stats cleared to 0.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.use('/api', api);

  // Serve files from public folder (e.g., MP4 videos, images)
  app.use(express.static(path.resolve(__dirname, 'public')));

  // ==========================================
  // DYNAMIC LINK REDIRECTION ENGINE
  // (Both /:slug and /r/:slug are handled)
  // ==========================================
  const handleRedirect = (slug: string, req: Request, res: Response, next: NextFunction) => {
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

    // Auto-Redirect Rule / Meta Review logic:
    // If enabled:
    // - Meta crawler visits => send to Safe Page (Link A) if defined
    // - Meta campaign status is PENDING_REVIEW => send users to Safe Page (Link A)
    // - Meta campaign status is ACTIVE => automatically route to Offer / Money Page (Link B)
    let destinationUrl = link.targetUrl;

    if (link.metaTracking?.enabled) {
      const { safePageUrl, moneyPageUrl, autoSwitchOnActive, effectiveStatus } = link.metaTracking;

      if (clickResult.isMetaCrawler && safePageUrl) {
        // Meta bot inspection always lands on the approved Safe Page
        destinationUrl = safePageUrl;
      } else if (autoSwitchOnActive && safePageUrl && moneyPageUrl) {
        if (effectiveStatus === 'ACTIVE') {
          // Campaign is approved! Land on Offer / Money Page
          destinationUrl = moneyPageUrl;
        } else if (effectiveStatus === 'PENDING_REVIEW' || !effectiveStatus) {
          // Campaign is still pending review, land on Safe Page
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

    // Skip root, dots (files like .js, .css, .ico), reserved paths, and vite internals
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

  // ==========================================
  // FRONTEND INTEGRATION (Vite in dev, static in prod)
  // ==========================================
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dynamic Link Redirection Server running at http://localhost:${PORT}`);
    console.log(`🔗 Test static short link: http://localhost:${PORT}/link1`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
