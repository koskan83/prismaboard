import { t } from './i18n';

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

/**
 * Λαβή στην κάτω δεξιά γωνία που μεγαλώνει ή μικραίνει όλο το πάνελ (για να φαίνεται από το βάθος της τάξης).
 * Το μέγεθος μένει για την επόμενη φορά (localStorage `key`).
 */
export function resizable(el: HTMLElement, key: string): void {
  const grip = document.createElement('div');
  grip.className = 'pgrip';
  grip.title = t('Σύρε για μεγαλύτερο ή μικρότερο', 'Drag to resize');
  el.append(grip);
  el.style.transformOrigin = 'top left';
  let s = 1;
  try { s = Number(localStorage.getItem(key)) || 1; } catch { /* χωρίς αποθήκευση */ }
  const apply = (v: number): void => {
    s = Math.max(0.6, Math.min(2.5, v));
    el.style.transform = s === 1 ? '' : `scale(${s})`;
  };
  apply(s);
  let from: { x: number; y: number; s: number } | null = null;
  grip.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    from = { x: e.clientX, y: e.clientY, s };
    grip.setPointerCapture(e.pointerId);
  });
  const follow = (e: PointerEvent): void => {
    if (!from) return;
    // η γωνία ακολουθεί το δάχτυλο: η αλλαγή σε πλάτος και ύψος, στο μέγεθος του πάνελ χωρίς κλίμακα
    const dw = (e.clientX - from.x) / el.offsetWidth, dh = (e.clientY - from.y) / el.offsetHeight;
    apply(from.s + (dw + dh) / 2);
  };
  grip.addEventListener('pointermove', follow);
  const end = (e: PointerEvent): void => {
    if (!from) return;
    if (e.type === 'pointerup') follow(e);
    from = null;
    keepOnScreen(el);
    try { localStorage.setItem(key, String(Math.round(s * 100) / 100)); } catch { /* δεν πειράζει */ }
  };
  grip.addEventListener('pointerup', end);
  grip.addEventListener('pointercancel', end);
}

/** Ολόκληρο το πάνελ μέσα στην οθόνη (π.χ. σε tablet όρθιο, όπου η αρχική θέση δίπλα στα άλλα πάνελ πέφτει έξω). */
export function keepOnScreen(el: HTMLElement): void {
  const r = el.getBoundingClientRect();
  if (r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight) return;
  el.style.left = Math.max(0, Math.min(r.left, window.innerWidth - r.width)) + 'px';
  el.style.top = Math.max(0, Math.min(r.top, window.innerHeight - r.height)) + 'px';
  el.style.right = 'auto';
}
