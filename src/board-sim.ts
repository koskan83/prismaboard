/**
 * Το πλαίσιο των τιμών κάτω από ένα σχήμα με δεδομένα (ελατήρια, εκκρεμές και ό,τι άλλο έχει StampDef.sim):
 * τι γράφει, πού βρίσκεται, πώς σέρνεται και σβήνεται, και πώς αλλάζουν τα δεδομένα (μέθοδοι της Board, σε δικό τους αρχείο).
 */

import { StampItem, unrot } from './model';
import type { SpringState } from './stamps';
import type { Board } from './board';
import { stampSim, type SimData } from './sim-def';

/** Ό,τι χρειάζονται οι τιμές από τον πίνακα (και η σχεδίαση το έχει). */
export interface SimHost { springState(s: StampItem): SpringState }

/** Το επιλεγμένο σχήμα, αν έχει τιμές (ορισμό στο STAMPS), με δεδομένα ή χωρίς. */
export function selectedSim(bd: Board): StampItem | null {
  const it = bd.selected ? bd.page.items.find((x) => x.id === bd.selected) : undefined;
  return it && it.kind === 'stamp' && stampSim(it.name) ? it : null;
}

/** Αλλάζει το επιλεγμένο σχήμα με τιμές (δεδομένα, πλαίσιο), με αναίρεση. */
export function updateSelected(bd: Board, patch: Partial<StampItem>): void {
  const before = selectedSim(bd);
  if (!before) return;
  const after = { ...before, ...patch } as StampItem;
  bd.page.items[bd.page.items.indexOf(before)] = after;
  bd.push({ t: 'mod', p: bd.cur, before, after });
  bd.redraw();
}

/** Οι γραμμές του πλαισίου: τα δεδομένα, οι απαντήσεις (ανά τρεις σε κάθε σειρά) και, όσο κινείται ή κρατιέται, οι τιμές της στιγμής. */
export function simRows(host: SimHost, s: StampItem): { rows: string[]; fs: number; x0: number; y0: number } | null {
  const def = stampSim(s.name);
  if (!def || !s.sim || s.simOff) return null;
  const data = def.dataLine(s.sim);
  if (!data) return null;
  const lines = def.answers(s.sim);
  const live = def.live?.(s.sim, host.springState(s)) ?? null;
  const fs = Math.max(12, Math.min(22, Math.sqrt(s.w * s.h) * 0.07));
  const rows = [data];
  for (let i = 0; i < lines.length; i += 3) rows.push(lines.slice(i, i + 3).join('   '));
  if (live) rows.push(live);
  // κάτω από το σχήμα, ή όπου το έσυρε ο χρήστης
  const [dx, dy] = s.simXY ?? [0, 0];
  return { rows, fs, x0: dx, y0: s.h + fs * (def.gap ?? 1.4) + dy };
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
  return { x0: r.x0 - pad, y0: r.y0 - pad, x1: r.x0 + w + pad, y1: r.y0 + r.rows.length * r.fs * 1.35 + pad * 0.5 };
}

export const simFont = (fs: number): string => `600 ${fs}px system-ui, "Segoe UI", Roboto, sans-serif`;

/** Το ✕ που σβήνει το πλαίσιο των τιμών: κύκλος στην πάνω δεξιά γωνία του (μονάδες του σχήματος), όσο το σχήμα είναι επιλεγμένο. */
export function simClose(host: SimHost, s: StampItem): { x: number; y: number; r: number } | null {
  const b = simBox(host, s);
  const r = simRows(host, s);
  return b && r ? { x: b.x1, y: b.y0, r: Math.max(10, r.fs * 0.6) } : null;
}

/** Το επιλεγμένο σχήμα, αν το σημείο πέφτει στο ✕ του πλαισίου των τιμών του. */
export function simCloseAt(bd: Board, wx: number, wy: number): StampItem | null {
  const it = selectedSim(bd);
  const c = it && simClose(bd, it);
  if (!it || !c) return null;
  const [ux, uy] = unrot(it, wx, wy);
  // λίγο μεγαλύτερο από τον κύκλο, για το δάχτυλο
  return Math.hypot(ux - it.x - c.x, uy - it.y - c.y) < c.r * 1.4 ? it : null;
}

/** Το πλαίσιο των τιμών πάει εκεί που το έσυρε ο χρήστης (dx, dy σε μονάδες του σχήματος, από την αρχή του συρσίματος). */
export function moveSim(s: StampItem, dx: number, dy: number): StampItem {
  const [x, y] = s.simXY ?? [0, 0];
  return { ...s, simXY: [x + dx, y + dy] };
}

/** Το σχήμα του οποίου το πλαίσιο τιμών βρίσκεται κάτω από το σημείο. */
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

/** Τα δεδομένα του επιλεγμένου σχήματος από κείμενο («m = 2, k = 200, A = 0,1»)· κενό τα σβήνει. Το πλαίσιο ξαναφαίνεται. */
export function setSim(bd: Board, text: string): void {
  const def = selectedSim(bd) && stampSim(selectedSim(bd)!.name);
  if (!def) return;
  const sim = def.parse(text);
  updateSelected(bd, { sim: Object.keys(sim).length ? sim : undefined, simOff: undefined });
  bd.onUi();
}

/**
 * Λάσο γύρω από ένα σχήμα με τιμές και τα δεδομένα του: το σχήμα, το κείμενο της επιλογής
 * και τα χειρόγραφα (ink), που θέλουν πρώτα αναγνώριση.
 */
export function simAndText(bd: Board): { s: StampItem; text: string; ink: string[] } | null {
  if (bd.multi.length < 2) return null;
  const ids = new Set(bd.multi);
  const its = bd.page.items.filter((x) => ids.has(x.id));
  const shapes = its.filter((x): x is StampItem => x.kind === 'stamp' && !!stampSim(x.name));
  const text = its.map((x) => (x.kind === 'text' ? x.text : '')).filter(Boolean).join('\n');
  const ink = its.filter((x) => x.kind === 'stroke' && !x.hl).map((x) => x.id);
  if (shapes.length !== 1 || (!text && !ink.length)) return null;
  return { s: shapes[0], text, ink };
}

/** Οι τιμές πάνε στο σχήμα (προστίθενται σε όσες είχε), που μένει επιλεγμένο· το πλαίσιο ξαναφαίνεται αν είχε σβηστεί. */
export function applySim(bd: Board, id: string, sim: SimData): StampItem | null {
  const items = bd.page.items;
  const before = items.find((x): x is StampItem => x.id === id && x.kind === 'stamp');
  if (!before) return null;
  const after: StampItem = { ...before, sim: { ...before.sim, ...sim }, simOff: undefined };
  items[items.indexOf(before)] = after;
  bd.push({ t: 'mod', p: bd.cur, before, after });
  bd.multi = [];
  bd.selected = after.id;
  bd.redraw();
  bd.onUi();
  return after;
}
