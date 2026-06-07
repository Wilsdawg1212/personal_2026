import { useRef, useEffect } from 'react';
import * as THREE from 'three';

// Returns a ref containing a THREE.Vector2 in NDC space (-1 to +1)
export function useMouseNDC() {
  const ndcRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    function onMouseMove(e) {
      ndcRef.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      ndcRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return ndcRef;
}

// Returns a ref containing raw { x, y } client coords
export function useMousePosition() {
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMouseMove(e) {
      posRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return posRef;
}
