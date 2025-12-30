import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function ViewPaste() {
  const { id } = useParams();
  const [paste, setPaste] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!id) return;
    setErr(null);
    // IMPORTANT: to avoid decrementing view count, call /api/view/:id (not /api/pastes/:id)
    fetch(`${API}/api/view/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(json => setPaste(json))
      .catch(() => setErr('Paste not found or expired'));
  }, [id]);

  if (err) return <div className="error">{err}</div>;
  if (!paste) return <div>Loading…</div>;

  return (
    <div>
      <div className="meta">Expires: {paste.expires_at || 'Never'} • Remaining views (API): {paste.remaining_views === null ? 'Unlimited' : paste.remaining_views}</div>
      <pre>{paste.content}</pre>
    </div>
  );
}
