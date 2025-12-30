// backend/src/utils.js
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isPositiveInteger(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1;
}

export function nowMs(req) {
  if (process.env.TEST_MODE === '1' && req && req.get) {
    const h = req.get('x-test-now-ms');
    if (h) {
      const parsed = Number(h);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return Date.now();
}
