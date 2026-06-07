import { useState } from 'react';

export default function Contact({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      // TODO: wire up EmailJS or Formspree endpoint
      await new Promise((r) => setTimeout(r, 800)); // placeholder
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section id="contact" style={{ minHeight: '100vh' }}>
      {/* Three.js lure renders here — click it to open form */}

      {isOpen && (
        <div className="contact-form-overlay" role="dialog" aria-modal="true" aria-label="Contact form">
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          <h2>Drop a Line</h2>
          {status === 'sent' ? (
            <p>Message sent! I&apos;ll be in touch.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input name="name" type="text" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Message
                <textarea name="message" rows={5} value={form.message} onChange={handleChange} required />
              </label>
              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Casting...' : 'Send'}
              </button>
              {status === 'error' && <p role="alert">Something went wrong. Try again.</p>}
            </form>
          )}
        </div>
      )}
    </section>
  );
}
