import { useState, useEffect } from 'react';

export function useScrollDepth() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const scrollTop  = window.scrollY;
      const maxScroll  = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maxScroll > 0 ? scrollTop / maxScroll : 0);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return progress;
}
