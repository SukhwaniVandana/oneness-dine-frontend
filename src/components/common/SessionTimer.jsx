import { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────
   SessionTimer
   Props:
     startedAt  — ISO date string from backend
                  (table.sessionStartedAt)
     className  — optional extra class
   Renders:  HH:MM:SS  ticking live
───────────────────────────────────────────── */
export default function SessionTimer({ startedAt, className = '' }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) return;

    function compute() {
      const start = new Date(startedAt).getTime();
      const now   = Date.now();
      const diff  = Math.max(0, Math.floor((now - start) / 1000));

      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt || !elapsed) return null;

  return <span className={className}>⏱ {elapsed}</span>;
}
