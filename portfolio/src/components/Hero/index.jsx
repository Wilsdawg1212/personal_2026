export default function Hero() {
  const name  = 'Your Name';
  const title = 'Full-Stack Developer';

  return (
    <section id="hero">
      <div className="hero-inner">
        <div className="hero-text">
          <h1 className="hero-name">{name}</h1>
          <p  className="hero-title">{title}</p>
        </div>
        {/* Reflection lives in Three.js on the water surface — see heroReflection.js */}
      </div>

      <div className="hero-depth-indicator" aria-label="Scroll to explore">
        <div className="hero-depth-line" />
        <span className="hero-depth-label">dive deeper</span>
      </div>
    </section>
  );
}
