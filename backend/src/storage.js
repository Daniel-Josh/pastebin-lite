// backend/src/storage.js
import { pool } from './db.js';
import { nowMs } from './utils.js';

export class Storage {
  async ping() {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (e) {
      console.error('DB ping failed', e);
      return false;
    }
  }

  async createPaste({ id, content, created_at, expires_at, remaining_views }) {
    const sql = `INSERT INTO pastes (id, content, created_at, expires_at, remaining_views)
                 VALUES ($1, $2, $3, $4, $5)`;
    await pool.query(sql, [id, content, created_at, expires_at, remaining_views]);
  }

  // Get paste without decrement (used for frontend view & server HTML view)
  async getPasteWithoutCounting(id, req) {
    const now = nowMs(req);
    const res = await pool.query('SELECT id, content, created_at, expires_at, remaining_views FROM pastes WHERE id = $1', [id]);
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    const expires_at = row.expires_at === null ? null : Number(row.expires_at);
    const remaining_views = row.remaining_views === null ? null : Number(row.remaining_views);

    if (expires_at !== null && now >= expires_at) return null;
    if (remaining_views !== null && remaining_views <= 0) return null;
    return { id: row.id, content: row.content, created_at: Number(row.created_at), expires_at, remaining_views };
  }

  // Fetch and decrement view count atomically. Returns null if expired/no views/absent.
  async fetchAndCountView(id, req) {
    const now = nowMs(req);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const selectRes = await client.query('SELECT content, created_at, expires_at, remaining_views FROM pastes WHERE id = $1 FOR UPDATE', [id]);
      if (selectRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const row = selectRes.rows[0];
      const expires_at = row.expires_at === null ? null : Number(row.expires_at);
      let remaining_views = row.remaining_views === null ? null : Number(row.remaining_views);

      if (expires_at !== null && now >= expires_at) {
        // Optionally delete expired row
        await client.query('DELETE FROM pastes WHERE id = $1', [id]);
        await client.query('COMMIT');
        return null;
      }

      if (remaining_views !== null) {
        if (remaining_views <= 0) {
          await client.query('COMMIT');
          return null;
        }
        const newRem = remaining_views - 1;
        await client.query('UPDATE pastes SET remaining_views = $1 WHERE id = $2', [newRem, id]);
        await client.query('COMMIT');
        remaining_views = newRem;
      } else {
        await client.query('COMMIT');
      }

      return { id, content: row.content, created_at: Number(row.created_at), expires_at, remaining_views };
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch(_) {}
      console.error('fetchAndCountView error', e);
      return null;
    } finally {
      client.release();
    }
  }
}
