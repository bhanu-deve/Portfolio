/**
 * Bhanu Prasad Samal — Portfolio script
 * ---------------------------------------------------------
 * Plain JavaScript, no dependencies. Every feature lives in its own
 * init function and is started at the bottom, each wrapped in try/catch
 * so a problem in one feature can never break the rest of the page.
 */
'use strict';

/* =========================================================
   SETTINGS — the only values you should ever need to edit
   ========================================================= */
const CONFIG = {
  contactEmail: 'bhanuprasadsamal@gmail.com',

  // Put your resume PDF at this path (relative to index.html).
  resumeUrl: 'assets/Bhanu_Prasad_Samal_Resume.pdf',

  // Contact form email service (https://www.emailjs.com).
  // Until all three values are replaced, the form falls back to opening
  // the visitor's email app with the message pre-filled (mailto:).
  emailjs: {
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',
    publicKey: 'YOUR_PUBLIC_KEY',
  },

  rateLimitMs: 60000, // minimum gap between two real (EmailJS) sends
};

/* =========================================================
   HELPERS
   ========================================================= */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Run `callback` at most once per animation frame. */
function onFrame(callback) {
  let queued = false;
  return (...args) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      callback(...args);
    });
  };
}

/** Show a short message at the bottom of the screen. */
let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
}

/* =========================================================
   SCROLL REVEAL  (IntersectionObserver)
   ========================================================= */
function initScrollReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  if (reducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  items.forEach((el) => observer.observe(el));
}

/* =========================================================
   NAVIGATION — sticky style, mobile menu, active section
   ========================================================= */
function initNavigation() {
  const header = $('#siteHeader');
  const toggle = $('#navToggle');
  const menu = $('#navMenu');
  if (!header || !toggle || !menu) return;

  const links = $$('.nav-link', menu);

  // Stronger glass once the page has scrolled
  const updateHeader = onFrame(() => header.classList.toggle('scrolled', window.scrollY > 24));
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Mobile menu
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  links.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (menu.classList.contains('open') && !header.contains(event.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', () => setMenu(false));

  // Active link: whichever section crosses the middle band of the viewport
  const sections = links
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((link) => {
      const active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((section) => observer.observe(section));
  }

  // The last section can be too short to reach the middle band
  const checkBottom = onFrame(() => {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom && sections.length) setActive(sections[sections.length - 1].id);
  });
  window.addEventListener('scroll', checkBottom, { passive: true });
}

/* =========================================================
   CARD SPOTLIGHT — glow that follows the pointer over .spot cards
   ========================================================= */
function initSpotlight() {
  if (!finePointer()) return;
  let target = null;
  let x = 0;
  let y = 0;

  const paint = onFrame(() => {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--mx', x - rect.left + 'px');
    target.style.setProperty('--my', y - rect.top + 'px');
  });

  document.addEventListener(
    'pointermove',
    (event) => {
      const card = event.target instanceof Element ? event.target.closest('.spot') : null;
      if (!card) return;
      target = card;
      x = event.clientX;
      y = event.clientY;
      paint();
    },
    { passive: true }
  );
}

/* =========================================================
   CURSOR GLOW — a soft light that trails the mouse (desktop only)
   ========================================================= */
function initCursorGlow() {
  const glow = $('#cursorGlow');
  if (!glow || !finePointer() || reducedMotion()) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 3;
  let x = targetX;
  let y = targetY;
  let running = false;

  const step = () => {
    x += (targetX - x) * 0.12;
    y += (targetY - y) * 0.12;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
      requestAnimationFrame(step);
    } else {
      running = false;
    }
  };

  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      targetX = event.clientX;
      targetY = event.clientY;
      glow.classList.add('on');
      if (!running) {
        running = true;
        requestAnimationFrame(step);
      }
    },
    { passive: true }
  );
  document.documentElement.addEventListener('pointerleave', () => glow.classList.remove('on'));
}

/* =========================================================
   FLOATING PARTICLES — small drifting dots in the background
   ========================================================= */
function initParticles() {
  const holder = $('#particles');
  if (!holder || reducedMotion()) return;

  const count = window.innerWidth < 768 ? 8 : 20;
  const rand = (min, max) => min + Math.random() * (max - min);
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'particle';
    dot.style.setProperty('--x', rand(2, 98).toFixed(1) + '%');
    dot.style.setProperty('--y', rand(2, 98).toFixed(1) + '%');
    dot.style.setProperty('--sz', rand(2, 4).toFixed(1) + 'px');
    dot.style.setProperty('--dx', rand(-50, 50).toFixed(0) + 'px');
    dot.style.setProperty('--dy', rand(-70, 30).toFixed(0) + 'px');
    dot.style.setProperty('--dur', rand(12, 24).toFixed(1) + 's');
    dot.style.setProperty('--delay', '-' + rand(0, 20).toFixed(1) + 's');
    fragment.appendChild(dot);
  }
  holder.appendChild(fragment);
}

/* =========================================================
   BACK TO TOP
   ========================================================= */
function initBackToTop() {
  const button = $('#toTop');
  if (!button) return;

  const update = onFrame(() => button.classList.toggle('show', window.scrollY > 600));
  window.addEventListener('scroll', update, { passive: true });
  update();

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  });
}

/* =========================================================
   LOADING BAR — finishes as soon as the page has loaded (no artificial delay)
   ========================================================= */
function initLoadingBar() {
  const bar = $('#pageProgress');
  if (!bar) return;

  const finish = () => {
    bar.classList.add('done');
    setTimeout(() => bar.remove(), 900);
  };
  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
}

/* =========================================================
   PROJECT DETAILS DIALOG
   ========================================================= */
function initProjectDialog() {
  const dialog = $('#projectDialog');
  const body = $('#projectDialogBody');
  const buttons = $$('[data-project-open]');
  if (!buttons.length) return;

  // Very old browsers without <dialog>: expand the details inside the card instead
  if (!dialog || !body || typeof dialog.showModal !== 'function') {
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const details = $('.project-details', button.closest('.project-card'));
        if (details) details.hidden = !details.hidden;
      });
    });
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.project-card');
      if (!card) return;

      const tag = $('.project-tag', card);
      const title = $('h3', card);
      const details = $('.project-details', card);
      const chips = $('.chips', card);

      const heading = document.createElement('h3');
      heading.id = 'projectDialogTitle';
      heading.textContent = title ? title.textContent : 'Project';

      const techTitle = document.createElement('h4');
      techTitle.textContent = 'Technologies';

      const nodes = [];
      if (tag) nodes.push(tag.cloneNode(true));
      nodes.push(heading);
      if (details) nodes.push(...Array.from(details.cloneNode(true).childNodes));
      if (chips) nodes.push(techTitle, chips.cloneNode(true));

      body.replaceChildren(...nodes);
      dialog.scrollTop = 0;
      dialog.showModal();
    });
  });

  // Close button + click on the dimmed backdrop (Escape is handled natively)
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-dialog-close]')) dialog.close();
  });
}

/* =========================================================
   RESUME DOWNLOAD — friendly message if the PDF hasn't been added yet
   ========================================================= */
function initResume() {
  const links = $$('[data-resume]');
  links.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        const response = await fetch(CONFIG.resumeUrl, { method: 'HEAD', cache: 'no-store' });
        if (!response.ok) throw new Error('Resume not found');

        const anchor = document.createElement('a');
        anchor.href = CONFIG.resumeUrl;
        anchor.download = '';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } catch {
        showToast('The resume is not available to download just yet. Please email me and I will send it over.');
      }
    });
  });
}

/* =========================================================
   CONTACT FORM — validation, states, EmailJS or mailto fallback
   ========================================================= */
function initContactForm() {
  const form = $('#contactForm');
  const button = $('#sendBtn');
  const statusBox = $('#formStatus');
  if (!form || !button || !statusBox) return;

  const label = $('.btn-label', button);
  const fields = {
    name: $('#cf-name'),
    email: $('#cf-email'),
    subject: $('#cf-subject'),
    message: $('#cf-message'),
  };
  const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const rules = {
    name: (v) => (v.length < 2 ? 'Please enter your full name.' : ''),
    email: (v) => (!emailPattern.test(v) ? 'Please enter a valid email address.' : ''),
    subject: (v) => (v.length < 3 ? 'Please add a short subject (at least 3 characters).' : ''),
    message: (v) =>
      v.length < 10 ? 'Your message should be at least 10 characters.' : v.length > 2000 ? 'Please keep your message under 2000 characters.' : '',
  };

  // Strip control characters and surrounding spaces. No HTML-escaping here:
  // values are only ever used as plain text (textContent / mailto), never as HTML.
  const clean = (value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

  function setFieldError(key, message) {
    const input = fields[key];
    const error = $('#cf-' + key + '-err');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message;
  }

  function validateField(key) {
    const message = rules[key](clean(fields[key].value));
    setFieldError(key, message);
    return !message;
  }

  function setStatus(type, text, link) {
    statusBox.className = 'form-status';
    statusBox.replaceChildren();
    if (!type) return;

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', type === 'success' ? '#i-check' : '#i-alert');
    icon.appendChild(use);

    const message = document.createElement('span');
    message.textContent = text + ' ';
    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.text;
      message.appendChild(anchor);
    }

    statusBox.classList.add('show', type);
    statusBox.append(icon, message);
  }

  function setBusy(busy) {
    button.disabled = busy;
    label.textContent = busy ? 'Sending…' : 'Send Message';
  }

  const emailJsReady = () => Object.values(CONFIG.emailjs).every((v) => v && !v.startsWith('YOUR_'));

  const mailtoHref = (data) =>
    `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(data.subject)}` +
    `&body=${encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`)}`;

  // Validate a field once the visitor leaves it, then keep it up to date while typing
  Object.keys(fields).forEach((key) => {
    fields[key].addEventListener('blur', () => {
      if (fields[key].value.trim() !== '' || fields[key].getAttribute('aria-invalid') === 'true') validateField(key);
    });
    fields[key].addEventListener('input', () => {
      if (fields[key].getAttribute('aria-invalid') === 'true') validateField(key);
    });
  });

  let lastSent = 0;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    // Honeypot — bots fill every field; people never see this one
    const honeypot = $('#hp_field');
    if (honeypot && honeypot.value) return;

    // Validate everything and focus the first problem
    const invalid = Object.keys(fields).filter((key) => !validateField(key));
    if (invalid.length) {
      fields[invalid[0]].focus();
      setStatus('error', 'Please fix the highlighted fields and try again.');
      return;
    }

    const data = {
      name: clean(fields.name.value),
      email: clean(fields.email.value),
      subject: clean(fields.subject.value),
      message: clean(fields.message.value),
    };

    // ── Option 1: EmailJS (only when real credentials are configured) ──
    if (emailJsReady()) {
      const wait = CONFIG.rateLimitMs - (Date.now() - lastSent);
      if (wait > 0) {
        setStatus('error', `Please wait ${Math.ceil(wait / 1000)} seconds before sending another message.`);
        return;
      }

      setBusy(true);
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: CONFIG.emailjs.serviceId,
            template_id: CONFIG.emailjs.templateId,
            user_id: CONFIG.emailjs.publicKey,
            template_params: {
              from_name: data.name,
              from_email: data.email,
              subject: data.subject,
              message: data.message,
              to_email: CONFIG.contactEmail,
            },
          }),
        });
        if (!response.ok) throw new Error('EmailJS responded with ' + response.status);

        lastSent = Date.now();
        form.reset();
        setStatus('success', "Thank you! Your message has been sent. I'll get back to you soon.");
      } catch {
        setStatus('error', 'Sorry, your message could not be sent.', { href: mailtoHref(data), text: 'Email me directly instead.' });
      } finally {
        setBusy(false);
      }
      return;
    }

    // ── Option 2: no email service configured → open the visitor's email app ──
    setStatus('success', 'Almost there — your email app should open with the message ready. Just press send.', {
      href: mailtoHref(data),
      text: "Nothing happened? Click here.",
    });
    window.location.href = mailtoHref(data);
  });
}

/* =========================================================
   FOOTER YEAR
   ========================================================= */
function initYear() {
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
}

/* =========================================================
   START — each feature is isolated so one failure can't stop the rest
   ========================================================= */
[
  initScrollReveal,
  initNavigation,
  initLoadingBar,
  initSpotlight,
  initCursorGlow,
  initParticles,
  initBackToTop,
  initProjectDialog,
  initResume,
  initContactForm,
  initYear,
].forEach((init) => {
  try {
    init();
  } catch (error) {
    console.error(`[portfolio] ${init.name} failed:`, error);
  }
});
