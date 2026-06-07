import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';

export default function AudioToggle() {
  const [muted, setMuted] = useState(true);
  const howlRef = useRef(null);

  useEffect(() => {
    howlRef.current = new Howl({
      src:    ['/audio/underwater-ambient.mp3'],
      loop:   true,
      volume: 0.3,
      mute:   true, // always start muted
    });
    // Do NOT autoplay — wait for explicit toggle
    return () => howlRef.current?.unload();
  }, []);

  function toggle() {
    const h = howlRef.current;
    if (!h) return;

    if (muted) {
      h.mute(false);
      if (!h.playing()) h.play();
    } else {
      h.mute(true);
    }
    setMuted((m) => !m);
  }

  return (
    <button
      onClick={toggle}
      aria-label={muted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      style={{
        position:        'fixed',
        top:             '1.5rem',
        right:           '1.5rem',
        zIndex:          100,
        background:      'transparent',
        border:          'none',
        fontSize:        '1.25rem',
        cursor:          'pointer',
        color:           'var(--color-text)',
        opacity:         0.7,
        transition:      'opacity 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
