import { useState, useEffect } from 'react';

const STORAGE_KEY = 'deepcast_bites';

export function useBiteCounter() {
  const [bites, setBites] = useState(() => {
    return parseInt(sessionStorage.getItem(STORAGE_KEY) ?? '0', 10);
  });

  function bite() {
    setBites((prev) => {
      const next = prev + 1;
      sessionStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return { bites, bite };
}

export default function BiteCounter({ bites }) {
  return (
    <div
      style={{
        position:   'fixed',
        bottom:     '1.5rem',
        left:       '1.5rem',
        zIndex:     100,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize:   '0.75rem',
        color:      'var(--color-bioluminescent-teal)',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-label={`${bites} project bites today`}
    >
      {`🎣 ${bites} bite${bites !== 1 ? 's' : ''} today`}
    </div>
  );
}
