// backend/src/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

import { Storage } from './storage.js';
import { escapeHtml, isPositiveInteger, nowMs } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(cors()); // allow requests from frontend domain (configure in prod)

const PORT = process.env.PORT || 4000;
const storage = new Storage();

// healthcheck
app.get('/api/healthz', async (req, res) => {
  const ok = await storage.ping();
  return res.status(200).json({ ok: !!ok });
});

// create paste
app.post('/api/pastes', async (req, res) => {
  try {
    const { content, ttl_seconds, max_views } = req.body || {};

    if (typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'content required' });
    }
    if (ttl_seconds !== undefined && ttl_seconds !== null && !isPositiveInteger(ttl_seconds)) {
      return res.status(400).json({ error: 'ttl_seconds must be integer >=1' });
    }
    if (max_views !== undefined && max_views !== null && !isPositiveInteger(max_views)) {
      return res.status(400).json({ error: 'max_views must be integer >=1' });
    }

    const id = uuidv4();
    const created_at = nowMs(req);
    const expires_at = ttl_seconds ? created_at + Number(ttl_seconds) * 1000 : null;
    const remaining_views = max_views ? Number(max_views) : null;

    await storage.createPaste({ id, content, created_at, expires_at, remaining_views });

    const host = req.get('host') || (process.env.BASE_URL ? new URL(process.env.BASE_URL).host : `localhost:${PORT}`);
    const proto = req.get('x-forwarded-proto') || req.protocol || (process.env.BASE_URL && process.env.BASE_URL.startsWith('https') ? 'https' : 'http');
    const url = `${proto}://${host}/p/${id}`;

    return res.status(201).json({ id, url });
  } catch (e) {
    console.error('POST /api/pastes error', e);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

// fetch paste (counts as a view)
app.get('/api/pastes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await storage.fetchAndCountView(id, req);
    if (!result) return res.status(404).json({ error: 'not_found' });

    return res.status(200).json({
      content: result.content,
      remaining_views: result.remaining_views === null ? null : result.remaining_views,
      expires_at: result.expires_at === null ? null : new Date(result.expires_at).toISOString()
    });
  } catch (e) {
    console.error('GET /api/pastes/:id error', e);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

// view without counting for HTML or frontend view
app.get('/api/view/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const paste = await storage.getPasteWithoutCounting(id, req);
    if (!paste) return res.status(404).json({ error: 'not_found'});

    return res.status(200).json({
      content: paste.content,
      remaining_views: paste.remaining_views === null ? null : paste.remaining_views,
      expires_at: paste.expires_at === null ? null : new Date(paste.expires_at).toISOString()
    });
  } catch (e) {
    console.error('GET /api/view/:id error', e);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

// HTML view for direct links (does NOT decrement)
app.get('/p/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const paste = await storage.getPasteWithoutCounting(id, req);
    if (!paste) {
      res.status(404).send('<h1>404 Not Found</h1><p>Paste not found or unavailable.</p>');
      return;
    }
    const safe = escapeHtml(paste.content);
    const expiresAt = paste.expires_at === null ? 'Never' : new Date(paste.expires_at).toISOString();
    const remainingViews = paste.remaining_views === null ? 'Unlimited' : paste.remaining_views;

    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Paste ${id}</title>
<style>body{font-family:system-ui, -apple-system, Roboto, Arial; padding:20px} pre{white-space:pre-wrap;background:#f7f7f7;padding:16px;border-radius:6px}</style>
</head>
<body>
  <h1>Paste</h1>
  <div style="color:#666">Expires: ${expiresAt} • Remaining views (API): ${remainingViews}</div>
  <pre>${safe}</pre>
</body>
</html>`;
    res.status(200).type('html').send(html);
  } catch (e) {
    console.error('GET /p/:id error', e);
    res.status(500).send('<h1>500 Internal Server Error</h1>');
  }
});

// optional root
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Pastebin backend' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});
