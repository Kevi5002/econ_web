document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initForms();
});
// Mobile nav toggle
function initNavToggle() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggleBtn || !nav) return;
 
  toggleBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
 
  // Close menu after tapping a link (mobile UX — otherwise it stays open)
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
 
  // Close menu if you tap outside of it
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('open')) return;
    if (nav.contains(e.target) || toggleBtn.contains(e.target)) return;
    nav.classList.remove('open');
  });
}

// form handling will be set up here
// function initForms() {
//   const forms = document.querySelectorAll('form');
//   if (!forms) return;


// end of form handling

