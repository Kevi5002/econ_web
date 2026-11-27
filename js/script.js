document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initTicker();
});

// Mobile nav toggle
function initNavToggle() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggleBtn || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    toggleBtn.setAttribute('aria-expanded', String(open));
  };

  toggleBtn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

  // Close menu after tapping a link (mobile UX — otherwise it stays open)
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setOpen(false));
  });

  // Close menu if you tap outside of it
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('open')) return;
    if (nav.contains(e.target) || toggleBtn.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

// Live economic ticker: reads data/ticker.json (refreshed daily by
// .github/workflows/update-ticker.yml). If anything fails, the hard-coded
// values in the markup simply stay in place.
function initTicker() {
  const cells = document.querySelectorAll('[data-metric]');
  if (!cells.length) return;

  const sign = (v) => (v >= 0 ? '+' : '');
  const fmt = {
    gdp_growth:   (m) => `${sign(m.value)}${m.value.toFixed(1)}% (${m.year})`,
    unemployment: (m) => `${m.value.toFixed(1)}% (${m.year})`,
    cpi:          (m) => `${sign(m.value)}${m.value.toFixed(1)}%`,
    fed_funds:    (m) => `${m.value.toFixed(2)}%`,
  };

  fetch('data/ticker.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      cells.forEach((el) => {
        const key = el.dataset.metric;
        const m = data[key];
        if (m && typeof m.value === 'number' && fmt[key]) el.textContent = fmt[key](m);
      });
    })
    .catch(() => { /* keep static fallback values */ });
}
