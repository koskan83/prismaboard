/**
 * Παιχνίδια του Δημοτικού σε όλη την οθόνη (Συλλαβές, Ορθογραφία, Κρεμάλα): το παιχνίδι μεγαλώνει όσο χωράει, και κάθε
 * πάτημα ή σύρσιμο πάει σε αυτό· έτσι ένα γράμμα που πιάνεται λίγο δίπλα δεν μετακινεί το παιχνίδι ούτε τον πίνακα.
 * Η πόρτα πάνω δεξιά (ή το Esc) γυρίζει στον πίνακα και σβήνει το παιχνίδι από τη σελίδα (με αναίρεση). Δίπλα της, το «📋 Λέξεις»
 * δείχνει τις έτοιμες λέξεις του παιχνιδιού για να προστεθούν ή να βγουν (ready-ui.ts).
 */

import type { Board } from './board';
import { spellState } from './kids/spell-words';
import type { StampItem } from './model';
import { t } from './i18n';
import { openReady } from './ready-ui';
import { STAMPS } from './stamps';

/** Τα παιχνίδια που παίζονται σε όλη την οθόνη. */
const FULL = new Set(['syllables', 'spell', 'hangman']);

/**
 * Το παιχνίδι ανοίγει σε όλη την οθόνη. Όχι η Ορθογραφία «με το χέρι»: εκεί ο μαθητής γράφει με το μολύβι πάνω στον πίνακα.
 */
export function playsFull(it: StampItem): boolean {
  if (!FULL.has(it.name) || !STAMPS[it.name]?.drawKid) return false;
  return !(it.name === 'spell' && spellState(it.v ?? []).hand);
}

/** Πού είναι το παιχνίδι στην οθόνη (για το κομφετί και τη μασκότ). */
export interface GameSpot { x: number; y: number; left: number; top: number; right: number; bottom: number }

export function openGameView(board: Board, id: string, onFx: (ev: string, at: GameSpot) => void = () => {}): void {
  const start = board.page.items.find((x) => x.id === id);
  if (!start || start.kind !== 'stamp' || document.getElementById('gameView')) return;
  const name = start.name, d = STAMPS[name];
  let v = board.kidState(id);
  if (!v || !d?.drawKid) return;

  const root = document.createElement('div');
  root.id = 'gameView';
  const cv = document.createElement('canvas');
  const door = document.createElement('button');
  door.className = 'gameDoor';
  door.textContent = '🚪';
  door.title = t('Πίσω στον πίνακα (Esc)', 'Back to the board (Esc)');
  // οι έτοιμες λέξεις του παιχνιδιού (του 🎲 ή των τάξεων): φαίνονται και αλλάζουν
  const words = document.createElement('button');
  words.className = 'gameWords';
  words.textContent = t('📋 Λέξεις', '📋 Words');
  words.title = t('Οι έτοιμες λέξεις του παιχνιδιού: δες τες, πρόσθεσε ή βγάλε', 'The game\'s ready words: see them, add or remove');
  words.onclick = () => void openReady(name);
  root.append(cv, words, door);
  document.body.append(root);
  document.body.classList.add('building');
  const c = cv.getContext('2d')!;

  /** Το παιχνίδι μεγαλώνει όσο χωράει, με τις αναλογίες του, στη μέση της οθόνης. */
  let W = 0, H = 0, s = 1, ox = 0, oy = 0;
  const layout = (): void => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = root.clientWidth;
    H = root.clientHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    // λίγος χώρος πάνω για την πόρτα, όταν η οθόνη είναι πιο φαρδιά από το παιχνίδι
    const pad = 8, top = Math.min(64, H * 0.08);
    s = Math.min((W - 2 * pad) / start.w, (H - top - pad) / start.h);
    ox = (W - start.w * s) / 2;
    oy = Math.max(top, (H - start.h * s) / 2);
    if (oy + start.h * s > H - pad) oy = (H - start.h * s) / 2;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };
  const spot = (): GameSpot => ({ x: ox + (start.w * s) / 2, y: oy + (start.h * s) / 2, left: ox, top: oy, right: ox + start.w * s, bottom: oy + start.h * s });
  const fx = (ev: string | null | undefined): void => {
    if (ev) onFx(ev, spot());
  };

  /** Κίνηση μετά από αλλαγή (για παιχνίδια με animMs), όπως στον πίνακα. */
  let anim: { t0: number; prev: number[] } | null = null;
  const animate = (prev: number[]): void => {
    if (!d.animMs) return;
    const idle = !anim;
    anim = { t0: performance.now(), prev };
    if (!idle) return;
    const tick = (): void => {
      if (!anim || !root.isConnected) return;
      if (performance.now() - anim.t0 > d.animMs!) anim = null;
      draw();
      if (anim) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const draw = (): void => {
    c.fillStyle = '#f1f5f9';
    c.fillRect(0, 0, W, H);
    c.save();
    c.translate(ox, oy);
    c.scale(s, s);
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, start.w, start.h);
    c.fillStyle = '#111111';
    c.strokeStyle = '#111111';
    d.drawKid!(c, start.w, start.h, v!, { ink: '#111111', bg: '#ffffff', names: board.kidNames(), anim: anim ? { t: performance.now() - anim.t0, prev: anim.prev } : undefined });
    c.restore();
  };

  let dirty = false;
  const commit = (): void => {
    if (dirty) board.setKidState(id, v!);
    dirty = false;
  };
  /** Νέα κατάσταση από πάτημα ή ερώτηση: ήχος, κίνηση, και γράφεται αμέσως στη σελίδα. */
  const change = (next: number[]): void => {
    fx(d.fx ? d.fx(v!, next) : 'click');
    animate(v!);
    v = next;
    dirty = true;
    commit();
    draw();
    // η Ορθογραφία πέρασε σε γραφή με το χέρι: γυρίζουμε στον πίνακα, όπου γράφει το μολύβι
    if (name === 'spell' && spellState(v).hand) close();
  };
  let closed = false;
  /** `dismiss`: η πόρτα (ή το Esc) σβήνει το παιχνίδι από τη σελίδα· χωρίς αυτό (Ορθογραφία με το χέρι) μένει στον πίνακα. */
  const close = (dismiss = false): void => {
    if (closed) return;
    closed = true;
    commit();
    removeEventListener('resize', layout);
    removeEventListener('keydown', key, true);
    document.body.classList.remove('building');
    root.remove();
    if (dismiss) board.dismissKid(id);
  };
  const key = (e: KeyboardEvent): void => {
    // όσο είναι ανοιχτό ένα παράθυρο ερώτησης (λέξεις, δική μου λέξη), τα πλήκτρα είναι δικά του
    if (document.getElementById('ask')) return;
    e.stopPropagation();
    if (e.key === 'Escape') close(true);
  };
  door.onclick = () => close(true);

  const at = (e: PointerEvent): [number, number] => {
    const r = cv.getBoundingClientRect();
    return [(e.clientX - r.left - ox) / s, (e.clientY - r.top - oy) / s];
  };
  /** Πάτημα σε κουμπί του παιχνιδιού: ερώτηση (π.χ. «Δική μου λέξη») ή αλλαγή κατάστασης. */
  const press = (x: number, y: number): void => {
    const q = d.ask?.(v!, x, y, start.w, start.h);
    if (q && !q.area) {
      void board.onAsk(q).then((text) => {
        const next = text == null || closed ? null : q.apply(text);
        if (next) change(next);
      });
      return;
    }
    const next = d.tap?.(v!, x, y, start.w, start.h, { names: board.kidNames() });
    if (next) change(next);
  };

  const ptrs = new Map<number, Record<string, number>>();
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const [x, y] = at(e);
    // ένα δάχτυλο τη φορά: το δεύτερο (π.χ. η παλάμη) δεν ξεκινά άλλο σύρσιμο
    if (ptrs.size) return;
    if (x < 0 || y < 0 || x > start.w || y > start.h) return;
    const st: Record<string, number> = {};
    const next = d.paint?.(v!, x, y, start.w, start.h, st, true);
    if (next) {
      try { cv.setPointerCapture(e.pointerId); } catch { /* δάχτυλο που μόλις σηκώθηκε */ }
      ptrs.set(e.pointerId, st);
      fx(d.fx ? d.fx(v!, next) : null);
      v = next;
      dirty = true;
      draw();
      return;
    }
    press(x, y);
  });
  cv.addEventListener('pointermove', (e) => {
    const st = ptrs.get(e.pointerId);
    if (!st) return;
    const [x, y] = at(e);
    const next = d.paint!(v!, x, y, start.w, start.h, st, false);
    if (next) {
      v = next;
      dirty = true;
      draw();
    }
  });
  const up = (e: PointerEvent): void => {
    if (!ptrs.delete(e.pointerId)) return;
    // το παιχνίδι «κλείνει» το σύρσιμο (Συλλαβές: το γράμμα πέφτει στο νούφαρο)
    const before = v!;
    const end = d.drop?.(v!);
    if (end) {
      animate(before);
      v = end.v;
      fx(end.ev);
    }
    commit();
    draw();
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  addEventListener('resize', layout);
  addEventListener('keydown', key, true);
  layout();
}
