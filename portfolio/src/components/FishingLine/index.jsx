import { useEffect, useRef } from 'react';
import { useScrollDepth } from '../../hooks/useScrollDepth.js';

export default function FishingLine() {
  const canvasRef  = useRef(null);
  const targetXRef = useRef(window.innerWidth * 0.9);
  const currentX   = useRef(window.innerWidth * 0.9);
  const rafRef     = useRef(null);
  const scrollProgress = useScrollDepth();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    function onMouseMove(e) {
      targetXRef.current = e.clientX;
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      canvas.width = canvas.width; // clear
      const x = currentX.current;

      ctx.beginPath();
      ctx.moveTo(x, 0);

      // Subtle catenary curve using quadratic bezier
      const cpX = x + Math.sin(Date.now() * 0.001) * 20;
      ctx.quadraticCurveTo(cpX, canvas.height * 0.5, x, canvas.height * scrollProgress);

      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth   = 1;
      ctx.globalAlpha = 0.7;
      ctx.stroke();

      // Lerp toward mouse
      currentX.current += (targetXRef.current - currentX.current) * 0.05;

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        50,
      }}
    />
  );
}
