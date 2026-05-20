import { useState, useEffect } from 'react';

/**
 * SessionTimer — live ticking HH:MM:SS
 * Props:
 *   startedAt — ISO date string
 *   className — CSS class
 *   style     — inline style object
 */
export default function SessionTimer({ startedAt, className = '', style = {} }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) return;

    function compute() {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`⏱ ${h}:${m}:${s}`);
    }

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt || !elapsed) return null;

  return <span className={className} style={style}>{elapsed}</span>;
}
