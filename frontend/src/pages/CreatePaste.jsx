import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function CreatePaste() {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState('');
  const [views, setViews] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setResult(null);
    setLoading(true);

    const body = { content };
    if (ttl) body.ttl_seconds = Number(ttl);
    if (views) body.max_views = Number(views);

    try {
      const res = await fetch(`${API}/api/pastes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || 'Error creating paste');
      } else {
        // If frontend hosted on Vercel, you will want to use frontend domain + /p/:id
        const frontendBase = window.location.origin.replace(/\/$/, '');
        const url = `${frontendBase}/p/${json.id}`;
        setResult({ id: json.id, url });
      }
    } catch (e) {
      setErr(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Content</label>
        <textarea value={content} onChange={e=>setContent(e.target.value)} rows="10" required />
        <div style={{display:'flex', gap:12, marginTop:8}}>
          <div>
            <label>TTL seconds (optional)</label><br/>
            <input type="number" min="1" value={ttl} onChange={e=>setTtl(e.target.value)} />
          </div>
          <div>
            <label>Max views (API) (optional)</label><br/>
            <input type="number" min="1" value={views} onChange={e=>setViews(e.target.value)} />
          </div>
        </div>
        <div style={{marginTop:12}}>
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create paste'}</button>
        </div>
      </form>

      {err && <div className="error">{err}</div>}
      {result && (
        <div className="result">
          <div>Paste created: <a href={result.url} target="_blank" rel="noreferrer">{result.url}</a></div>
          <div className="meta">API: <code>/api/pastes/{result.id}</code></div>
        </div>
      )}
    </div>
  );
}
