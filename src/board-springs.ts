/** Ταλάντωση ελατηρίων (μέθοδοι της Board, σε δικό τους αρχείο). */

import { StampItem, unrot } from './model';
import { STAMPS, SpringState } from './stamps';
import type { Board } from './board';
import { parseSim, periodMs } from './osc-sim';
import { t } from './i18n';

/** Περίοδος της ταλάντωσης των ελατηρίων και χρόνος απόσβεσης. */
const OSC_PERIOD_MS = 1600;
const OSC_FADE_MS = 5000;

export function springState(bd: Board, s: StampItem): SpringState {
  const marks = !!s.marks;
  if (bd.oscDrag?.id === s.id) return { d: bd.oscDrag.d, amp: Math.abs(bd.oscDrag.d), marks, pinned: !!s.pin };
  const o = bd.osc.get(s.id);
  // ακίνητο: στη θέση που διάλεξε ο χρήστης (οι γραμμές ±A στο πλάτος που ορίστηκε), αλλιώς στην ισορροπία
  if (!o) return s.pos !== undefined ? { d: s.pos, amp: s.A ?? Math.abs(s.pos), marks, pinned: true } : { d: 0, amp: 0, marks };
  const t = performance.now() - o.t0;
  // σχήματα με κίνηση (κύματα, κρούση): μόνο ο χρόνος
  if (STAMPS[s.name]?.play) return { d: 0, amp: 0, marks, t };
  const fade = s.damp ? Math.exp(-t / OSC_FADE_MS) : 1;
  // με δεδομένα (m, k ή L): η πραγματική περίοδος
  const ph = (2 * Math.PI * t) / (periodMs(s.sim, s.name === 'pendulum') ?? OSC_PERIOD_MS);
  return { d: o.amp * fade * Math.cos(ph), amp: Math.abs(o.amp), marks, ph, fade };
}

/** Το ελατήριο του οποίου το σώμα βρίσκεται κάτω από το σημείο. */
export function springAt(bd: Board, wx: number, wy: number): StampItem | null {
  const items = bd.page.items;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.kind !== 'stamp') continue;
    const g = STAMPS[it.name]?.spring?.(it.w, it.h);
    if (!g) continue;
    const st = bd.springState(it);
    const [bx, by] = g.bob ? g.bob(st.d, !st.amp && !st.d) : [g.cx + g.ux * st.d, g.cy + g.uy * st.d];
    const [ux, uy] = unrot(it, wx, wy);
    if (Math.hypot(ux - (it.x + bx), uy - (it.y + by)) < g.r) return it;
  }
  return null;
}

export function runOsc(bd: Board): void {
  if (bd.oscRaf) return;
  const loop = (): void => {
    const now = performance.now();
    let ended = false;
    for (const [id, o] of bd.osc) {
      const it = bd.page.items.find((x) => x.id === id);
      const ms = it?.kind === 'stamp' ? STAMPS[it.name]?.playMs : undefined;
      // σβήνει όταν το πλάτος γίνει αμελητέο, τελειώσει η κίνηση μίας φοράς ή το ελατήριο διαγραφεί
      if (!it || it.kind !== 'stamp' || (it.damp && Math.abs(o.amp) * Math.exp(-(now - o.t0) / OSC_FADE_MS) < 0.7)) bd.osc.delete(id);
      else if (ms && now - o.t0 > ms) { bd.osc.delete(id); ended = true; }
    }
    if (bd.osc.size) {
      bd.renderLive();
      bd.oscRaf = requestAnimationFrame(loop);
    } else {
      bd.oscRaf = 0;
      bd.redraw();
    }
    // το κουμπί γυρίζει σε ▶
    if (ended) bd.onUi();
  };
  bd.oscRaf = requestAnimationFrame(loop);
}

/** Το επιλεγμένο ελατήριο, αν η επιλογή είναι ελατήριο. */
export function selectedSpring(bd: Board): StampItem | null {
  const it = bd.selected ? bd.page.items.find((x) => x.id === bd.selected) : undefined;
  return it && it.kind === 'stamp' && (STAMPS[it.name]?.spring || STAMPS[it.name]?.play) ? it : null;
}

/** ▶/⏸ για το επιλεγμένο σχήμα με κίνηση (κύματα, κρούση, κυκλική κίνηση). */
export function togglePlay(bd: Board): void {
  const it = bd.selectedSpring;
  if (!it || !STAMPS[it.name]?.play) return;
  if (bd.osc.has(it.id)) bd.osc.delete(it.id);
  else {
    bd.osc.set(it.id, { amp: 1, t0: performance.now() });
    bd.runOsc();
  }
  bd.redraw();
  bd.onUi();
}

export function springMoving(bd: Board): boolean {
  return !!bd.selected && bd.osc.has(bd.selected);
}

/** Αλλάζει ιδιότητα του επιλεγμένου ελατηρίου (σημάνσεις, απόσβεση). */
export function updateSpring(bd: Board, patch: Partial<StampItem>): void {
  const before = bd.selectedSpring;
  if (!before) return;
  const after = { ...before, ...patch } as StampItem;
  bd.page.items[bd.page.items.indexOf(before)] = after;
  bd.push({ t: 'mod', p: bd.cur, before, after });
  bd.redraw();
}

/** Το πλάτος που ζωγραφίζεται στις θέσεις ±A, όταν δεν έχει οριστεί από τον χρήστη. */
function defaultA(s: StampItem): number {
  const g = STAMPS[s.name]?.spring?.(s.w, s.h);
  return g ? Math.round(g.max * 0.7) : 0;
}

/** Η θέση του σώματος που κρατιέται: Θ.Ι. → +A → −A → Θ.Ι. (σταματά όποια ταλάντωση). */
export function cyclePos(bd: Board): void {
  const s = bd.selectedSpring;
  if (!s || STAMPS[s.name]?.play) return;
  bd.osc.delete(s.id);
  const A = s.A ?? (s.pos ? Math.abs(s.pos) : defaultA(s));
  const p = s.pos ?? 0;
  updateSpring(bd, { pos: Math.abs(p) < 1e-6 ? A : p > 0 ? -Math.abs(p) : 0, A });
  bd.onUi();
}

/** Το όνομα της θέσης όπου κρατιέται το σώμα, για το κουμπί. */
export function posName(s: StampItem): string {
  const p = s.pos ?? 0;
  if (Math.abs(p) < 1e-6) return t('Θ.Ι.', 'Eq.');
  const A = s.A ?? Math.abs(p);
  if (Math.abs(Math.abs(p) - A) < 0.5) return p > 0 ? '+A' : '−A';
  return 'x';
}

/** 📌: όταν αφήνεις το σώμα μένει εκεί· αν βγει πέρα από το ±A που ορίστηκε, εκείνη η θέση γίνεται η ακραία. */
export function setPinnedAt(bd: Board, id: string, d: number): void {
  const s = bd.page.items.find((x) => x.id === id);
  if (!s || s.kind !== 'stamp') return;
  bd.selected = id;
  const A = s.A && Math.abs(d) <= s.A + 0.5 ? s.A : Math.abs(d) || s.A;
  updateSpring(bd, { pos: d, A });
}

/** Τα δεδομένα της προσομοίωσης από κείμενο («m = 2, k = 200, A = 0,1»)· κενό τα σβήνει. */
export function setSim(bd: Board, text: string): void {
  const sim = parseSim(text);
  updateSpring(bd, { sim: Object.keys(sim).length ? sim : undefined });
  bd.onUi();
}

/** Σταματά την ταλάντωση του επιλεγμένου ελατηρίου· το σώμα γυρίζει στη θέση ισορροπίας. */
export function stopSpring(bd: Board): void {
  if (bd.selected) bd.osc.delete(bd.selected);
  bd.redraw();
  bd.onUi();
}
