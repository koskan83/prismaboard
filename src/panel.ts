/** Κοινά για τα αιωρούμενα πάνελ της τάξης: σύρσιμο από την κεφαλίδα (ποντίκι, στυλό, αφή). */
export function dragByHeader(el: HTMLElement, handle: HTMLElement): void {
  let ox = 0;
  let oy = 0;
  let active = false;
  handle.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    active = true;
    const r = el.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (!active) return;
    el.style.left = Math.max(0, Math.min(e.clientX - ox, window.innerWidth - 80)) + 'px';
    el.style.top = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - 60)) + 'px';
    el.style.right = 'auto';
  });
  const end = () => (active = false);
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  // περιστροφή tablet ή μικρότερο παράθυρο: το πάνελ ξαναμπαίνει μέσα στην οθόνη
  window.addEventListener('resize', () => el.classList.contains('hidden') || keepOnScreen(el));
}

/** Ολόκληρο το πάνελ μέσα στην οθόνη (π.χ. σε tablet όρθιο, όπου η αρχική θέση δίπλα στα άλλα πάνελ πέφτει έξω). */
export function keepOnScreen(el: HTMLElement): void {
  const r = el.getBoundingClientRect();
  if (r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight) return;
  el.style.left = Math.max(0, Math.min(r.left, window.innerWidth - r.width)) + 'px';
  el.style.top = Math.max(0, Math.min(r.top, window.innerHeight - r.height)) + 'px';
  el.style.right = 'auto';
}
