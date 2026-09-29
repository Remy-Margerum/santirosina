// The demo provider's adapter (2026-09-29): a shop button that goes nowhere says so. A press shows the slot's note
// (role=status, so a screen reader hears it) and nothing else happens: no cart, no request, no navigation. The header's
// Log in button shows the cart's note.
const show = (note) => {
  if (!note) return;
  note.hidden = false;
  clearTimeout(note._t);
  note._t = setTimeout(() => { note.hidden = true; }, 6000);
};
document.addEventListener('click', (e) => {
  const el = e.target instanceof Element ? e.target.closest('[data-shop][data-provider="demo"]') : null;
  if (!el) return;
  e.preventDefault();
  const slot = el.closest('.shop-slot');
  show(slot && slot.querySelector('.shop-note'));
  if (el.getAttribute('data-shop') === 'account') show(document.getElementById('shop-note-cart'));
});
