/** Ταλάντωση ελατηρίων (μέθοδοι της Board, σε δικό τους αρχείο). */

import { StampItem, uid, unrot } from './model';
import { STAMPS, SpringState } from './stamps';
import type { Board } from './board';
import { dataLine, liveLine, parseSim, periodMs, simLines } from './osc-sim';
import { t } from './i18n';

/** Περίοδος της ταλάντωσης των ελατηρίων και χρόνος απόσβεσης. */
const OSC_PERIOD_MS = 1600;
const OSC_FADE_MS = 5000;

export function springState(bd: Board, s: StampItem): SpringState {
  const marks = !!s.marks;
  // με το 📌 το πλάτος μένει αυτό της άσκησης, όσο κι αν σέρνεις
  if (bd.oscDrag?.id === s.id) return { d: bd.oscDrag.d, amp: s.pin ? pinA(s) : Math.abs(bd.oscDrag.d), marks, pinned: !!s.pin };
  const o = bd.osc.get(s.id);
  // ακίνητο: στη θέση που διάλεξε ο χρήστης (οι γραμμές ±A στο πλάτος που ορίστηκε), αλλιώς στην ισορροπία
  if (!o) return s.pos !== undefined ? { d: s.pos, amp: s.A ?? Math.abs(s.pos), marks, pinned: true } : { d: 0, amp: 0, marks };
  const t = performance.now() - o.t0;
  // σχήματα με κίνηση (κύματα, κρούση): μόνο ο χρόνος
  if (STAMPS[s.name]?.play) return { d: 0, amp: 0, marks, t };
  const fade = s.damp ? Math.exp(-t / OSC_FADE_MS) : 1;
  // με δεδομένα (m, k ή L): η πραγματική περίοδος
  const ph = (2 * Math.PI * t) / (periodMs(s.sim, s.name === 'pendulum', s.name === 'springV') ?? OSC_PERIOD_MS);
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

/** Το πλάτος της άσκησης στο σχήμα: όπως ορίστηκε, αλλιώς το προεπιλεγμένο. Δεν αλλάζει όταν σέρνεις με το 📌. */
export function pinA(s: StampItem): number {
  return s.A ?? defaultA(s);
}

/** 📌: η θέση όπου σύρθηκε το σώμα, μέσα στο ±A, «κουμπωμένη» στις Θ.Ι., ±A/2 και ±A όταν είναι κοντά. */
export function pinSnap(s: StampItem, d: number): number {
  const A = pinA(s);
  if (!A) return d;
  const c = Math.max(-A, Math.min(A, d));
  for (const q of [-A, -A / 2, 0, A / 2, A]) if (Math.abs(c - q) < A * 0.08) return q;
  return c;
}

/** Η θέση του σώματος που κρατιέται: Θ.Ι. → +A → −A → Θ.Ι. (σταματά όποια ταλάντωση). */
export function cyclePos(bd: Board): void {
  const s = bd.selectedSpring;
  if (!s || STAMPS[s.name]?.play) return;
  bd.osc.delete(s.id);
  const A = pinA(s);
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

/** 📌: όταν αφήνεις το σώμα μένει εκεί, πάντα μέσα στο ίδιο ±A (η άσκηση δεν αλλάζει). */
export function setPinnedAt(bd: Board, id: string, d: number): void {
  const s = bd.page.items.find((x) => x.id === id);
  if (!s || s.kind !== 'stamp') return;
  bd.selected = id;
  updateSpring(bd, { pos: pinSnap(s, d), A: pinA(s) });
}

/**
 * Λάσο γύρω από ένα ελατήριο (ή εκκρεμές) και τα δεδομένα του: το ελατήριο, το κείμενο της επιλογής
 * και τα χειρόγραφα (ink), που θέλουν πρώτα αναγνώριση.
 */
export function springAndText(bd: Board): { s: StampItem; text: string; ink: string[] } | null {
  if (bd.multi.length < 2) return null;
  const ids = new Set(bd.multi);
  const its = bd.page.items.filter((x) => ids.has(x.id));
  const springs = its.filter((x): x is StampItem => x.kind === 'stamp' && !!STAMPS[x.name]?.spring);
  const text = its.map((x) => (x.kind === 'text' ? x.text : '')).filter(Boolean).join('\n');
  const ink = its.filter((x) => x.kind === 'stroke' && !x.hl).map((x) => x.id);
  if (springs.length !== 1 || (!text && !ink.length)) return null;
  return { s: springs[0], text, ink };
}

/** Οι τιμές πάνε στο ελατήριο (προστίθενται σε όσες είχε), που μένει επιλεγμένο. */
export function applySim(bd: Board, id: string, sim: NonNullable<StampItem['sim']>): StampItem | null {
  const items = bd.page.items;
  const before = items.find((x): x is StampItem => x.id === id && x.kind === 'stamp');
  if (!before) return null;
  const after: StampItem = { ...before, sim: { ...before.sim, ...sim } };
  items[items.indexOf(before)] = after;
  bd.push({ t: 'mod', p: bd.cur, before, after });
  bd.multi = [];
  bd.selected = after.id;
  bd.redraw();
  bd.onUi();
  return after;
}

/** Ό,τι χρειάζονται οι τιμές από τον πίνακα (και η σχεδίαση το έχει). */
export interface SimHost { springState(s: StampItem): SpringState }

/** Οι γραμμές κάτω από ελατήριο με δεδομένα: τα δεδομένα, οι τιμές της ταλάντωσης και (όσο κινείται ή κρατιέται) οι τιμές της στιγμής. */
export function simRows(host: SimHost, s: StampItem): { rows: string[]; fs: number; y0: number } | null {
  const pend = s.name === 'pendulum';
  const lines = simLines(s.sim, pend, s.name === 'springV');
  const data = dataLine(s.sim);
  if (!data) return null;
  const st = host.springState(s);
  const r = st.ph !== undefined ? Math.cos(st.ph) * (st.fade ?? 1) : st.pinned && st.amp ? st.d / st.amp : 0;
  const live = st.ph !== undefined || st.pinned ? liveLine(s.sim, pend, r, st.ph, st.fade, s.name === 'springV') : null;
  const fs = Math.max(12, Math.min(22, Math.sqrt(s.w * s.h) * 0.07));
  // οι σταθερές τιμές σε δύο-τρεις σειρές, και από κάτω οι τιμές της στιγμής
  const rows = [data];
  for (let i = 0; i < lines.length; i += 3) rows.push(lines.slice(i, i + 3).join('   '));
  if (live) rows.push(live);
  return { rows, fs, y0: s.h + fs * (s.name === 'spring' ? 0.8 : 1.4) };
}

let measure: CanvasRenderingContext2D | null = null;
/** Το πλαίσιο των τιμών (στις μονάδες του σχήματος), για να πατιέται και να αλλάζουν. */
export function simBox(host: SimHost, s: StampItem): { x0: number; y0: number; x1: number; y1: number } | null {
  const r = simRows(host, s);
  if (!r) return null;
  measure ??= document.createElement('canvas').getContext('2d')!;
  measure.font = simFont(r.fs);
  const w = Math.max(...r.rows.map((x) => measure!.measureText(x).width));
  const pad = r.fs * 0.4;
  return { x0: -pad, y0: r.y0 - pad, x1: w + pad, y1: r.y0 + r.rows.length * r.fs * 1.35 + pad * 0.5 };
}

export const simFont = (fs: number): string => `600 ${fs}px system-ui, "Segoe UI", Roboto, sans-serif`;

/** Το ελατήριο του οποίου το πλαίσιο τιμών βρίσκεται κάτω από το σημείο. */
export function simAt(bd: Board, wx: number, wy: number): StampItem | null {
  const items = bd.page.items;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.kind !== 'stamp' || !it.sim) continue;
    const b = simBox(bd, it);
    if (!b) continue;
    const [ux, uy] = unrot(it, wx, wy);
    const x = ux - it.x, y = uy - it.y;
    if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return it;
  }
  return null;
}

/** Αντίγραφο του ελατηρίου με την ίδια άσκηση, στοιχισμένο κάτω (οριζόντιο, κεκλιμένο) ή δεξιά (κατακόρυφο, εκκρεμές), στην επόμενη θέση. */
export function alignedCopy(s: StampItem): StampItem {
  const below = s.name === 'spring' || s.name === 'springIncline';
  // χώρος και για τις τιμές που γράφονται κάτω από το σχήμα
  const rows = s.sim ? 4 : 0, fs = Math.max(12, Math.min(22, Math.sqrt(s.w * s.h) * 0.07));
  const step = below ? s.h * 1.45 + rows * fs * 1.35 : Math.max(s.w * 1.5, s.sim ? s.w + fs * 17 : 0);
  const A = pinA(s), p = s.pos ?? 0;
  const pos = Math.abs(p) < 1e-6 ? A : p > 0 ? -A : 0;
  return { ...s, id: uid(), x: s.x + (below ? 0 : step), y: s.y + (below ? step : 0), pos, A };
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
