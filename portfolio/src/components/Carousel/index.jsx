import { useRef } from 'react';

// ── Bob timing table ───────────────────────────────────────────────────────
// Each card gets a unique duration + negative delay so they drift out of phase.
// Negative delays start the animation mid-cycle — no synchronized pop on load.
const BOB_PARAMS = [
  { dur: '3.3s', delay: '0s'    },
  { dur: '2.8s', delay: '-1.4s' },
  { dur: '3.7s', delay: '-0.8s' },
  { dur: '2.6s', delay: '-2.2s' },
  { dur: '3.1s', delay: '-1.9s' },
  { dur: '3.5s', delay: '-0.4s' },
];

// ── Default placeholder items ──────────────────────────────────────────────
// Replace `image` with a path like '/assets/highlight-1.jpg'
// Replace `caption` with your summary text.
export const DEFAULT_CAROUSEL_ITEMS = [
  {
    id:      1,
    image:   null,
    caption: '✏️  Drop an image path into src/components/About/index.jsx and replace this caption with a short summary — a project, a moment, or anything worth highlighting.',
  },
  {
    id:      2,
    image:   null,
    caption: '✏️  Second card. Keep captions short — 1 or 2 sentences at most. The card height will grow to fit.',
  },
  {
    id:      3,
    image:   null,
    caption: '✏️  Third card. Add as many as you like; the track scrolls horizontally.',
  },
  {
    id:      4,
    image:   null,
    caption: '✏️  Fourth card. Images are cropped to a 4:3 frame — portrait or landscape both work.',
  },
];

// ── Image placeholder (shown when no src is provided or image fails to load) ─
function ImgPlaceholder() {
  return (
    <div className="carousel-img-placeholder" aria-hidden="true">
      <svg viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* mountains + sun — generic "image" icon */}
        <circle cx="42" cy="11" r="6" stroke="currentColor" strokeWidth="1.3"/>
        <path
          d="M0 36 L16 18 L28 28 L38 18 L56 36"
          stroke="currentColor" strokeWidth="1.3"
          fill="none" strokeLinejoin="round" strokeLinecap="round"
        />
      </svg>
      <span>image.jpg</span>
    </div>
  );
}

// ── Carousel ───────────────────────────────────────────────────────────────
export default function Carousel({ items = DEFAULT_CAROUSEL_ITEMS }) {
  const trackRef  = useRef(null);
  const dragging  = useRef(false);
  const dragStart = useRef(0);
  const scrollAt  = useRef(0);

  // ── Drag-to-scroll ─────────────────────────────────────────────────────
  function onPointerDown(e) {
    dragging.current = true;
    dragStart.current = e.clientX;
    scrollAt.current  = trackRef.current.scrollLeft;
    trackRef.current.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current;
    trackRef.current.scrollLeft = scrollAt.current - dx;
  }

  function onPointerUp() {
    dragging.current = false;
  }

  // ── Arrow navigation ───────────────────────────────────────────────────
  const CARD_W = 308; // card width + gap — matches CSS

  function scrollLeft()  { trackRef.current?.scrollBy({ left: -CARD_W, behavior: 'smooth' }); }
  function scrollRight() { trackRef.current?.scrollBy({ left:  CARD_W, behavior: 'smooth' }); }

  return (
    <div className="carousel-wrapper">
      <button
        className="carousel-arrow carousel-arrow--left"
        onClick={scrollLeft}
        aria-label="Previous"
      >
        ‹
      </button>

      <div
        ref={trackRef}
        className="carousel-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {items.map((item, i) => {
          const { dur, delay } = BOB_PARAMS[i % BOB_PARAMS.length];
          return (
            <article
              key={item.id}
              className="carousel-item"
              style={{ '--bob-dur': dur, '--bob-delay': delay }}
            >
              <div className="carousel-img-frame">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="carousel-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Placeholder — always in DOM, hidden when real image loads */}
                <ImgPlaceholder />
              </div>

              <p className="carousel-caption">{item.caption}</p>
            </article>
          );
        })}
      </div>

      <button
        className="carousel-arrow carousel-arrow--right"
        onClick={scrollRight}
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}
