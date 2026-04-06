/**
 * Bhanu Prasad Samal | Portfolio Script
 * Security: Input sanitization, XSS prevention, rate limiting on form
 */

'use strict';

/* =========================================================
   UTILITIES
   ========================================================= */

/**
 * Sanitize a string to prevent XSS — strips HTML tags and encodes entities.
 */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate an email address with a strict pattern.
 */
function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

/* =========================================================
   CUSTOM CURSOR  (Desktop only – hidden via CSS on mobile)
   ========================================================= */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  let rafId = null;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    rafId = requestAnimationFrame(animateRing);
  }

  animateRing();

  // Clean up on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!document.hidden && !rafId) {
      animateRing();
    }
  });
})();

/* =========================================================
   LOADER
   ========================================================= */
(function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  function hideLoader() {
    loader.classList.add('hidden');
    loader.addEventListener('transitionend', () => {
      loader.remove();
    }, { once: true });
  }

  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 2300);
  } else {
    window.addEventListener('load', () => {
      setTimeout(hideLoader, 2300);
    }, { once: true });
  }
})();

/* =========================================================
   MOBILE NAV TOGGLE
   ========================================================= */
(function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggle.focus();
    }
  });
})();

/* =========================================================
   SCROLL REVEAL
   ========================================================= */
(function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  // If reduced motion is preferred, make all visible immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // stop observing once revealed
      }
    });
  }, { threshold: 0.12 });

  items.forEach((el) => observer.observe(el));
})();

/* =========================================================
   ACTIVE NAV HIGHLIGHT ON SCROLL
   ========================================================= */
(function initNavHighlight() {
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach((sec) => observer.observe(sec));
})();

/* =========================================================
   CONTACT FORM  (Rate-limited + sanitized)
   ========================================================= */
(function initContactForm() {
  const form   = document.getElementById('contactForm');
  const btn    = document.getElementById('sendBtn');
  const status = document.getElementById('formStatus');
  if (!form || !btn || !status) return;

  // --- Simple client-side rate limit: 1 send per 60 s ---
  const RATE_LIMIT_MS = 60_000;
  let lastSent = 0;

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className = 'form-status ' + (type || '');
  }

  function resetBtn() {
    btn.disabled    = false;
    btn.textContent = '✉ Send Message';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Rate-limit check
    const now = Date.now();
    if (now - lastSent < RATE_LIMIT_MS) {
      const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastSent)) / 1000);
      setStatus(`⚠ Please wait ${remaining}s before sending again.`, 'error');
      return;
    }

    // Read & sanitize values
    const rawName    = document.getElementById('senderName').value;
    const rawEmail   = document.getElementById('senderEmail').value;
    const rawSubject = document.getElementById('subject').value;
    const rawMessage = document.getElementById('message').value;

    const name    = sanitize(rawName);
    const email   = sanitize(rawEmail);
    const subject = sanitize(rawSubject);
    const message = sanitize(rawMessage);

    // Validate
    if (!name || name.length < 2) {
      setStatus('⚠ Please enter a valid name.', 'error');
      return;
    }
    if (!isValidEmail(rawEmail.trim())) {
      setStatus('⚠ Please enter a valid email address.', 'error');
      return;
    }
    if (!subject || subject.length < 3) {
      setStatus('⚠ Please enter a subject.', 'error');
      return;
    }
    if (!message || message.length < 10) {
      setStatus('⚠ Message is too short (min 10 characters).', 'error');
      return;
    }
    if (message.length > 2000) {
      setStatus('⚠ Message is too long (max 2000 characters).', 'error');
      return;
    }

    // Honeypot: if a hidden field is filled, silently abort (bot check)
    const honeypot = document.getElementById('hp_field');
    if (honeypot && honeypot.value) return;

    btn.disabled    = true;
    btn.textContent = 'Sending…';
    setStatus('', '');

    // ── Try EmailJS ──
    // Replace the three placeholder values below with your real EmailJS credentials.
    const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
    const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
    const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:      EMAILJS_SERVICE_ID,
          template_id:     EMAILJS_TEMPLATE_ID,
          user_id:         EMAILJS_PUBLIC_KEY,
          template_params: {
            from_name:  name,
            from_email: email,
            subject:    subject,
            message:    message,
            to_email:   'bhanuprasadsamal@gmail.com',
          },
        }),
      });

      if (res.ok) {
        setStatus('✓ Message sent! I\'ll reply soon.', 'success');
        form.reset();
        lastSent = Date.now();
        resetBtn();
        return;
      }
      throw new Error('EmailJS responded with ' + res.status);
    } catch (err) {
      console.warn('EmailJS failed, using mailto fallback:', err.message);
    }

    // ── Mailto fallback ──
    try {
      const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      const mailto  = `mailto:bhanuprasadsamal@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
      window.open(mailto, '_blank', 'noopener,noreferrer');
      setStatus('✓ Opening your email client…', 'success');
      form.reset();
      lastSent = Date.now();
    } catch {
      setStatus('✗ Could not send. Please email bhanuprasadsamal@gmail.com directly.', 'error');
    }

    resetBtn();
  });
})();
