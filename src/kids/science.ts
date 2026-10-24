/**
 * Πειράματα Φυσικών του Δημοτικού (Ε΄–ΣΤ΄, και Γ΄ Γυμνασίου): κύκλωμα με λαμπάκια, ήχος, φως και σκιές,
 * ανάκλαση και διάθλαση, θερμότητα, μαγνήτης. Παίζονται σε όλη την οθόνη όπως τα παιχνίδια, με κίνηση όσο είναι ανοιχτά
 * (StampDef.live): τα ηλεκτρόνια τρέχουν, τα μόρια του αέρα πάλλονται, το νερό βράζει.
 * Κάθε πείραμα ζωγραφίζεται σε κουτί 960 × 640 (κλιμακώνεται στο πραγματικό) και η κατάστασή του είναι μια λίστα αριθμών.
 */
import type { StampDef } from '../stamps';
import { t } from '../i18n';
import { BLUE, GREEN, ORANGE, PURPLE, RED, YELLOW, el, kid, rrect, text, type C, type KidEnv } from './common';

const W0 = 960, H0 = 640;
/** Τα κουμπιά κάτω από τη σκηνή. */
const BY = 548, BH = 68;

interface Btn { id: string; label: string; x: number; w: number; color: string; on?: boolean; off?: boolean }

/** Φόντο της σκηνής (με δικό του χρώμα, για να μη φαίνεται η σελίδα από πίσω) και η μπάρα των κουμπιών. */
function frame(c: C, scene: string | CanvasGradient, env: KidEnv): void {
  rrect(c, 0, 0, W0, H0, 20);
  c.fillStyle = env.bg;
  c.fill();
  c.save();
  rrect(c, 0, 0, W0, 528, 20);
  c.clip();
  c.fillStyle = scene;
  c.fillRect(0, 0, W0, 528);
  c.restore();
}

function buttons(c: C, bs: Btn[]): void {
  for (const b of bs) {
    rrect(c, b.x, BY, b.w, BH, BH * 0.3);
    c.save();
    c.fillStyle = b.color;
    c.globalAlpha = b.off ? 0.3 : b.on === false ? 0.45 : 0.95;
    c.fill();
    if (b.on) {
      c.globalAlpha = 1;
      c.lineWidth = 5;
      c.strokeStyle = '#1e293b';
      c.stroke();
    }
    c.restore();
    text(c, b.label, b.x + b.w / 2, BY + BH / 2 + 1, Math.min(28, (b.w / Math.max(4, b.label.length)) * 1.7), '#ffffff', 700);
  }
}

/** Ποιο κουμπί πατήθηκε (συντεταγμένες 960 × 640). */
const hitBtn = (bs: Btn[], x: number, y: number): Btn | undefined => (y >= BY - 6 && y <= BY + BH + 6 ? bs.find((b) => !b.off && x >= b.x && x <= b.x + b.w) : undefined);

/** Σειρά κουμπιών με κενά ανάμεσα, από αριστερά. */
function row(items: Omit<Btn, 'x'>[], gap = 14, x0 = 24): Btn[] {
  let x = x0;
  return items.map((b) => {
    const o = { ...b, x };
    x += b.w + gap;
    return o;
  });
}

const sec = (env: KidEnv): number => (env.anim ? env.anim.t / 1000 : 0);
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

/** Κοινό για όλα: κλιμάκωση στο κουτί, και τα πατήματα στις συντεταγμένες 960 × 640. */
function lab(d: {
  label: string; init: number[];
  draw(c: C, v: number[], env: KidEnv): void;
  btns(v: number[]): Btn[];
  press(v: number[], id: string): number[] | null;
  tapScene?(v: number[], x: number, y: number): number[] | null;
  drag?(v: number[], x: number, y: number, st: Record<string, number>, first: boolean): number[] | null;
  fx?(prev: number[], next: number[]): string | null;
}): StampDef {
  const sx = (w: number): number => W0 / w, sy = (h: number): number => H0 / h;
  return kid({
    label: d.label, w: W0, h: H0, init: d.init, big: true, animMs: 2500, live: true,
    drawKid(c, w, h, v, env) {
      c.save();
      c.scale(w / W0, h / H0);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      d.draw(c, v, env);
      buttons(c, d.btns(v));
      c.restore();
    },
    tap(v, x, y, w, h) {
      const X = x * sx(w), Y = y * sy(h);
      const b = hitBtn(d.btns(v), X, Y);
      if (b) return d.press(v, b.id);
      return d.tapScene?.(v, X, Y) ?? null;
    },
    ...(d.drag ? { paint: (v: number[], x: number, y: number, w: number, h: number, st: Record<string, number>, first: boolean) => d.drag!(v, x * sx(w), y * sy(h), st, first) } : {}),
    fx: (prev, next) => (d.fx ? d.fx(prev, next) : 'click'),
  });
}

// ====================================================================================================
// Κύκλωμα με λαμπάκια: τάση, 1 ή 2 λάμπες σε σειρά ή παράλληλα, διακόπτης. Τα ηλεκτρόνια τρέχουν από το − στο +,
// η λάμπα φωτίζει ανάλογα με την τάση της, και με πολύ μεγάλη τάση καίγεται.
// Πάτημα σε μια λάμπα τη χαλάει (ή τη φτιάχνει): σε σειρά σβήνουν όλες, παράλληλα οι άλλες συνεχίζουν.
// v = [τάση (θέση στο VOLTS), λάμπες 1–3, παράλληλα 0|1, διακόπτης κλειστός 0|1, χαλασμένες (bit i: η λάμπα i)]
// ====================================================================================================

export const VOLTS = [1.5, 3, 4.5, 6, 9, 12];
/** Η τάση της λάμπας (V): με αυτήν φωτίζει κανονικά· πάνω από το BURN καίγεται. */
const RATED = 4.5, BURN = 7;

/** Η τάση σε κάθε λάμπα (0 αν δεν περνά ρεύμα). */
export function lampVolts(v: number[]): number[] {
  const [vi, n, par, sw, burned] = v, V = VOLTS[vi];
  const ok = (i: number): boolean => !(burned & (1 << i));
  if (!sw) return Array(n).fill(0);
  if (n === 1 || !par) {
    // σε σειρά: μια χαλασμένη λάμπα ανοίγει το κύκλωμα
    const all = Array.from({ length: n }, (_, i) => ok(i)).every(Boolean);
    return Array(n).fill(all ? V / n : 0);
  }
  return Array.from({ length: n }, (_, i) => (ok(i) ? V : 0));
}

/** Μετά από κάθε αλλαγή: όποια λάμπα παίρνει πολύ μεγάλη τάση καίγεται (σε σειρά καίγεται η μία και το κύκλωμα ανοίγει). */
export function circuitSettle(v: number[]): number[] {
  const out = [...v];
  const lv = lampVolts(out);
  if (out[1] === 1 || !out[2]) {
    if (lv[0] > BURN) out[4] |= 1;
  } else lv.forEach((x, i) => { if (x > BURN) out[4] |= 1 << i; });
  return out;
}

/** Τα σύρματα: ο κύριος βρόχος (από το − της μπαταρίας ως το +) και, στα παράλληλα, ένας κλάδος για κάθε άλλη λάμπα. */
const LOOP: [number, number][] = [[420, 440], [170, 440], [170, 110], [790, 110], [790, 440], [540, 440]];
/** Το ύψος του κλάδου κάθε λάμπας στα παράλληλα (η πρώτη είναι στο πάνω σύρμα). */
const ROWS = (n: number): number[] => (n === 2 ? [110, 270] : [110, 230, 350]);
const branch = (y: number): [number, number][] => [[310, 110], [310, y], [650, y], [650, 110]];
/** Ο δρόμος των ηλεκτρονίων που περνούν από τη λάμπα του κλάδου στο ύψος y. */
const through = (y: number): [number, number][] => (y === 110 ? LOOP : [[420, 440], [170, 440], [170, 110], [310, 110], [310, y], [650, y], [650, 110], [790, 110], [790, 440], [540, 440]]);
/** Πού κάθεται κάθε λάμπα πάνω στο σύρμα. */
export const lampSpots = (n: number, par: number): [number, number][] =>
  n === 1 ? [[480, 110]] : par ? ROWS(n).map((y) => [480, y] as [number, number]) : n === 2 ? [[370, 110], [590, 110]] : [[300, 110], [480, 110], [660, 110]];

function polyLen(p: [number, number][]): number {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
}
function polyAt(p: [number, number][], s: number): [number, number] {
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (s <= l) return [p[i - 1][0] + ((p[i][0] - p[i - 1][0]) * s) / l, p[i - 1][1] + ((p[i][1] - p[i - 1][1]) * s) / l];
    s -= l;
  }
  return p[p.length - 1];
}
function wire(c: C, p: [number, number][]): void {
  c.beginPath();
  p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = '#b45309';
  c.lineWidth = 9;
  c.stroke();
  c.strokeStyle = '#f59e0b';
  c.lineWidth = 4;
  c.stroke();
}
/** Ηλεκτρόνια πάνω στο σύρμα: μπλε τελείες με «−», που προχωρούν με ταχύτητα ανάλογη του ρεύματος. */
function electrons(c: C, p: [number, number][], speed: number, time: number, phase = 0): void {
  const L = polyLen(p), gap = 34;
  const off = (time * speed + phase * gap) % gap;
  for (let s = off; s < L; s += gap) {
    const [x, y] = polyAt(p, s);
    c.beginPath();
    c.arc(x, y, 7, 0, Math.PI * 2);
    c.fillStyle = '#2563eb';
    c.fill();
    c.fillStyle = '#ffffff';
    c.fillRect(x - 3.5, y - 1, 7, 2);
  }
}

function lamp(c: C, x: number, y: number, volts: number, burned: boolean, smoke: number): void {
  const b = burned ? 0 : clamp((volts / RATED) ** 2, 0, 1.6);
  const cy = y - 52;
  if (b > 0.02) {
    const g = c.createRadialGradient(x, cy, 10, x, cy, 60 + 110 * b);
    g.addColorStop(0, `rgba(253, 224, 71, ${Math.min(0.95, 0.5 + b * 0.4)})`);
    g.addColorStop(1, 'rgba(253, 224, 71, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, cy, 60 + 110 * b, 0, Math.PI * 2);
    c.fill();
  }
  // βάση
  c.fillStyle = '#94a3b8';
  rrect(c, x - 20, y - 22, 40, 26, 5);
  c.fill();
  // γυαλί
  c.beginPath();
  c.arc(x, cy, 34, 0, Math.PI * 2);
  c.fillStyle = burned ? '#cbd5e1' : b > 0.02 ? `rgb(254, ${Math.round(249 - 40 * Math.min(1, b))}, ${Math.round(195 - 120 * Math.min(1, b))})` : '#f1f5f9';
  c.fill();
  c.strokeStyle = '#475569';
  c.lineWidth = 3;
  c.stroke();
  if (burned) {
    // μαυρισμένο γυαλί
    c.fillStyle = 'rgba(30, 41, 59, 0.35)';
    c.beginPath();
    c.arc(x - 6, cy - 6, 18, 0, Math.PI * 2);
    c.fill();
  }
  // νήμα (σπασμένο στην καμένη)
  c.strokeStyle = burned ? '#334155' : b > 0.02 ? '#f97316' : '#64748b';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x - 12, y - 22);
  c.lineTo(x - 12, cy + 4);
  for (let i = 0; i < 5; i++) c.lineTo(x - 12 + (i + 0.5) * 4.8, cy + (i % 2 ? 4 : -6));
  if (burned) c.moveTo(x + 6, cy - 2);
  c.lineTo(x + 12, cy + 4);
  c.lineTo(x + 12, y - 22);
  c.stroke();
  if (b > 0.9) {
    // ακτίνες, όσο πιο δυνατή τόσο πιο μακριές
    c.strokeStyle = '#facc15';
    c.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + ((i - 3.5) * Math.PI) / 9;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * 46, cy + Math.sin(a) * 46);
      c.lineTo(x + Math.cos(a) * (60 + 24 * b), cy + Math.sin(a) * (60 + 24 * b));
      c.stroke();
    }
  }
  if (smoke > 0) {
    // καπνός που ανεβαίνει και σβήνει
    for (let i = 0; i < 4; i++) {
      const k = smoke * (1 + i * 0.3);
      c.beginPath();
      c.arc(x + Math.sin(k * 6 + i) * 10, cy - 40 - k * 120 - i * 18, 12 + i * 4, 0, Math.PI * 2);
      c.fillStyle = `rgba(100, 116, 139, ${Math.max(0, 0.6 - k * 0.5)})`;
      c.fill();
    }
  }
}

/** Η ετικέτα κάτω από τη λάμπα, σε άσπρο φόντο (ζωγραφίζεται μετά από όλες, για να μην τη σκεπάζει το φως των άλλων). */
function lampLabel(c: C, x: number, y: number, volts: number, burned: boolean, hot: boolean): void {
  // καμένη από μεγάλη τάση ή χαλασμένη με πάτημα
  const s = burned ? (hot ? t('Κάηκε!', 'Burnt!') : t('χαλασμένη', 'broken')) : volts > 0 && (volts / RATED) ** 2 < 0.3 ? t('λίγο φως', 'dim') : '';
  if (!s) return;
  c.font = `700 22px system-ui`;
  const w = c.measureText(s).width + 20;
  c.fillStyle = 'rgba(255, 255, 255, 0.92)';
  rrect(c, x - w / 2, y + 12, w, 30, 10);
  c.fill();
  text(c, s, x, y + 27, 22, burned ? RED : '#475569', 700);
}

function battery(c: C, vi: number): void {
  const x0 = 420, x1 = 540, y = 440;
  c.fillStyle = '#1f2937';
  rrect(c, x0, y - 30, x1 - x0, 60, 10);
  c.fill();
  c.fillStyle = '#f59e0b';
  rrect(c, x1 - 34, y - 30, 34, 60, 8);
  c.fill();
  c.fillStyle = '#9ca3af';
  c.fillRect(x1, y - 10, 10, 20);
  text(c, `${el(VOLTS[vi])} V`, (x0 + x1) / 2 - 12, y + 1, 26, '#ffffff', 800);
  text(c, '−', x0 - 16, y - 42, 34, '#1e293b', 800);
  text(c, '+', x1 + 18, y - 42, 34, RED, 800);
}

function switcher(c: C, closed: boolean): void {
  // διακόπτης στο αριστερό σύρμα, ανάμεσα σε y 240 και 320
  c.fillStyle = '#f8fafc';
  c.fillRect(150, 236, 40, 88);
  c.fillStyle = '#334155';
  for (const y of [244, 316]) {
    c.beginPath();
    c.arc(170, y, 8, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = '#334155';
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(170, 316);
  c.lineTo(closed ? 170 : 220, closed ? 244 : 262);
  c.stroke();
  text(c, closed ? t('κλειστός', 'closed') : t('ανοιχτός', 'open'), 92, 280, 22, closed ? GREEN : RED, 700);
}

const circuit = lab({
  label: t('Κύκλωμα με λαμπάκια', 'Circuit with bulbs'), init: [2, 1, 0, 0, 0],
  draw(c, v, env) {
    const [vi, n, par, sw, burned] = v;
    const time = sec(env);
    const sky = c.createLinearGradient(0, 0, 0, 528);
    sky.addColorStop(0, '#eef2ff');
    sky.addColorStop(1, '#e0f2fe');
    frame(c, sky, env);
    const parallel = n > 1 && !!par;
    wire(c, LOOP);
    if (parallel) for (const y of ROWS(n).slice(1)) wire(c, branch(y));
    battery(c, vi);
    switcher(c, !!sw);
    const lv = lampVolts(v);
    // καπνός για όσες κάηκαν ή χάλασαν μόλις τώρα
    const was = env.anim?.prev[4] ?? burned;
    const smoke = (i: number): number => (burned & (1 << i) && !(was & (1 << i)) && env.anim && env.anim.t < 2400 ? env.anim.t / 2400 : 0);
    const spots = lampSpots(n, par);
    // ηλεκτρόνια: ταχύτητα ανάλογη με το ρεύμα. Σε σειρά ένας δρόμος· παράλληλα ένας για κάθε λάμπα που ανάβει,
    // και στο κοινό σύρμα οι δρόμοι μαζεύονται (περισσότερα ηλεκτρόνια, μεγαλύτερο ρεύμα)
    if (sw) {
      if (!parallel) {
        if (lv[0] > 0) electrons(c, LOOP, 22 * lv[0], time);
      } else spots.forEach(([, y], i) => { if (lv[i] > 0) electrons(c, through(y), 13 * lv[i], time, i / n); });
    }
    const Vl = n === 1 || !par ? VOLTS[vi] / n : VOLTS[vi];
    spots.forEach(([x, y], i) => lamp(c, x, y, lv[i], !!(burned & (1 << i)), smoke(i)));
    spots.forEach(([x, y], i) => lampLabel(c, x, y, lv[i], !!(burned & (1 << i)), Vl > BURN));
    // τι δείχνει το πείραμα, με απλά λόγια
    text(c, n === 1 ? t('ροή ηλεκτρονίων: από το − στο +', 'electron flow: from − to +')
      : parallel ? t('παράλληλα: κάθε λάμπα έχει τον δικό της δρόμο · πάτα μια λάμπα να τη χαλάσεις', 'parallel: each bulb has its own path · tap a bulb to break it')
        : t('σε σειρά: ένας δρόμος για όλες · πάτα μια λάμπα να τη χαλάσεις', 'in series: one path for all · tap a bulb to break it'), 480, 500, 20, '#475569', 600);
  },
  btns(v) {
    const [vi, n, par, sw, burned] = v;
    return row([
      { id: 'v-', label: '−', w: 60, color: BLUE, off: vi === 0 },
      { id: 'vv', label: `🔋 ${el(VOLTS[vi])} V`, w: 150, color: '#1f2937' },
      { id: 'v+', label: '+', w: 60, color: RED, off: vi === VOLTS.length - 1 },
      { id: 'n', label: n === 1 ? t('💡 1 λάμπα', '💡 1 bulb') : `${'💡'.repeat(n)} ${n} ${t('λάμπες', 'bulbs')}`, w: 170, color: ORANGE },
      { id: 'p', label: par ? t('παράλληλα', 'parallel') : t('σε σειρά', 'in series'), w: 140, color: PURPLE, off: n === 1 },
      { id: 's', label: sw ? t('🔌 άνοιξε', '🔌 open') : t('🔌 κλείσε', '🔌 close'), w: 140, color: sw ? RED : GREEN },
      ...(burned ? [{ id: 'r', label: t('🔄 νέες', '🔄 new'), w: 120, color: GREEN }] : []),
    ]);
  },
  press(v, id) {
    const o = [...v];
    if (id === 'v-') o[0] = Math.max(0, o[0] - 1);
    else if (id === 'v+') o[0] = Math.min(VOLTS.length - 1, o[0] + 1);
    else if (id === 'n') { o[1] = (o[1] % 3) + 1; o[4] = 0; }
    else if (id === 'p') o[2] = 1 - o[2];
    else if (id === 's') o[3] = 1 - o[3];
    else if (id === 'r') o[4] = 0;
    else return null;
    return circuitSettle(o);
  },
  tapScene(v, x, y) {
    // πάτημα στον διακόπτη: ανοίγει ή κλείνει
    if (Math.abs(x - 185) < 60 && y > 220 && y < 340) return circuitSettle([v[0], v[1], v[2], 1 - v[3], v[4]]);
    // πάτημα σε λάμπα: χαλάει (ή φτιάχνεται)
    const i = lampSpots(v[1], v[2]).findIndex(([lx, ly]) => Math.hypot(x - lx, y - (ly - 45)) < 55);
    return i < 0 ? null : circuitSettle([v[0], v[1], v[2], v[3], v[4] ^ (1 << i)]);
  },
  fx: (prev, next) => (next[4] & ~prev[4] ? 'bad' : next[3] !== prev[3] && lampVolts(next).some((x) => x > 0) ? 'good' : 'click'),
});

// ====================================================================================================
// Ήχος: ηχείο που πάλλεται, μόρια του αέρα που πυκνώνουν και αραιώνουν, και το κύμα από κάτω. Ύψος (ψιλός–βαθύς)
// και ένταση (σιγανά–δυνατά)· το «Άκου» παίζει τον ήχο. v = [ύψος 0–4, ένταση 0–2, πόσες φορές πατήθηκε το «Άκου»]
// ====================================================================================================

export const FREQ = [165, 262, 392, 587, 880];
const LAMBDA = [300, 220, 160, 115, 82];
const AMP = [0.35, 0.65, 1];

const sound = lab({
  label: t('Ήχος', 'Sound'), init: [2, 1, 0],
  draw(c, v, env) {
    const [p, l] = v, time = sec(env);
    frame(c, '#f0f9ff', env);
    const A = AMP[l], lam = LAMBDA[p], fv = 0.8 + p * 0.45;
    const ph = 2 * Math.PI * fv * time;
    // ηχείο
    c.fillStyle = '#334155';
    rrect(c, 40, 140, 120, 240, 16);
    c.fill();
    const push = A * 10 * Math.sin(ph);
    c.fillStyle = '#94a3b8';
    c.beginPath();
    c.ellipse(150 + push, 260, 26, 90, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1e293b';
    c.beginPath();
    c.arc(150 + push, 260, 16, 0, Math.PI * 2);
    c.fill();
    // μόρια του αέρα: πάνε μπρος–πίσω στη διεύθυνση του κύματος (διάμηκες)
    for (let i = 0; i < 34; i++) {
      for (let j = 0; j < 8; j++) {
        const x0 = 210 + i * 19 + (j % 2) * 9, y = 150 + j * 30;
        const x = x0 - A * 14 * Math.sin((2 * Math.PI * (x0 - 200)) / lam - ph);
        c.beginPath();
        c.arc(x, y, 5, 0, Math.PI * 2);
        c.fillStyle = j % 3 ? '#60a5fa' : '#38bdf8';
        c.fill();
      }
    }
    text(c, '👂', 900, 260, 80);
    // το κύμα από κάτω: πιο ψηλός ήχος → πιο πυκνό· πιο δυνατός → πιο ψηλό
    c.strokeStyle = PURPLE;
    c.lineWidth = 5;
    c.beginPath();
    for (let x = 200; x <= 860; x += 4) {
      const y = 450 - A * 48 * Math.sin((2 * Math.PI * (x - 200)) / lam - ph);
      if (x === 200) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    c.strokeStyle = '#cbd5e1';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(200, 450);
    c.lineTo(860, 450);
    c.stroke();
    text(c, `${FREQ[p]} Hz`, 100, 420, 26, '#334155', 800);
  },
  btns(v) {
    const [p, l] = v;
    return row([
      { id: 'p-', label: t('🐻 βαθύς', '🐻 low'), w: 160, color: BLUE, off: p === 0 },
      { id: 'p+', label: t('🐦 ψιλός', '🐦 high'), w: 160, color: PURPLE, off: p === 4 },
      { id: 'l-', label: t('🔈 σιγανά', '🔈 soft'), w: 160, color: GREEN, off: l === 0 },
      { id: 'l+', label: t('🔊 δυνατά', '🔊 loud'), w: 160, color: ORANGE, off: l === 2 },
      { id: 'play', label: t('▶ Άκου', '▶ Listen'), w: 170, color: RED },
    ], 16, 30);
  },
  press(v, id) {
    const [p, l, n] = v;
    if (id === 'p-') return [Math.max(0, p - 1), l, n + 1];
    if (id === 'p+') return [Math.min(4, p + 1), l, n + 1];
    if (id === 'l-') return [p, Math.max(0, l - 1), n + 1];
    if (id === 'l+') return [p, Math.min(2, l + 1), n + 1];
    if (id === 'play') return [p, l, n + 1];
    return null;
  },
  // κάθε αλλαγή ακούγεται, για να συγκρίνουν τα παιδιά
  fx: (_prev, next) => `tone|${FREQ[next[0]]}|${next[1]}`,
});

// ====================================================================================================
// Φως και σκιές: ο φακός σέρνεται, και η σκιά στον τοίχο μεγαλώνει όσο πλησιάζει στο αντικείμενο.
// Αδιαφανές, ημιδιαφανές ή διαφανές αντικείμενο. v = [θέση του φακού 0–100, υλικό 0–2, αναμμένος 0|1]
// ====================================================================================================

const OBJ_X = 600, OBJ_R = 46, WALL = 870, MID = 270;
const torchX = (p: number): number => 70 + p * 4.2;

const light = lab({
  label: t('Φως και σκιές', 'Light and shadows'), init: [30, 0, 1],
  draw(c, v, env) {
    const [p, mat, on] = v, tx = torchX(p);
    frame(c, on ? '#1e293b' : '#0f172a', env);
    // τοίχος
    c.fillStyle = on ? '#e2e8f0' : '#475569';
    c.fillRect(WALL, 20, 70, 490);
    if (on) {
      // η δέσμη του φακού ως τον τοίχο
      const g = c.createLinearGradient(tx, 0, WALL, 0);
      g.addColorStop(0, 'rgba(253, 224, 71, 0.75)');
      g.addColorStop(1, 'rgba(253, 224, 71, 0.18)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(tx + 40, MID - 14);
      c.lineTo(WALL, 30);
      c.lineTo(WALL, 510);
      c.lineTo(tx + 40, MID + 14);
      c.closePath();
      c.fill();
      // σκιά: από το φακό εφάπτεται στο αντικείμενο και φτάνει στον τοίχο (μεγαλύτερη όσο πιο κοντά ο φακός)
      const R = (OBJ_R * (WALL - tx - 40)) / (OBJ_X - tx - 40);
      if (mat < 2) {
        c.fillStyle = mat ? 'rgba(15, 23, 42, 0.35)' : 'rgba(15, 23, 42, 0.92)';
        c.beginPath();
        c.moveTo(OBJ_X, MID - OBJ_R);
        c.lineTo(WALL, MID - R);
        c.lineTo(WALL + 70, MID - R);
        c.lineTo(WALL + 70, MID + R);
        c.lineTo(WALL, MID + R);
        c.lineTo(OBJ_X, MID + OBJ_R);
        c.closePath();
        c.fill();
        c.fillStyle = mat ? 'rgba(15, 23, 42, 0.45)' : '#0f172a';
        c.beginPath();
        c.ellipse(WALL + 35, MID, 34, Math.min(R, 240), 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    // αντικείμενο: μπάλα (αδιαφανής), χαρτί (ημιδιαφανής), γυαλί (διαφανές)
    c.beginPath();
    c.arc(OBJ_X, MID, OBJ_R, 0, Math.PI * 2);
    c.fillStyle = ['#ea580c', 'rgba(241, 245, 249, 0.75)', 'rgba(186, 230, 253, 0.25)'][mat];
    c.fill();
    c.strokeStyle = mat === 2 ? '#e0f2fe' : '#fff7ed';
    c.lineWidth = 4;
    c.stroke();
    c.fillRect(OBJ_X - 4, MID + OBJ_R, 8, 510 - MID - OBJ_R);
    // φακός
    c.fillStyle = '#64748b';
    rrect(c, tx - 50, MID - 18, 90, 36, 8);
    c.fill();
    c.fillStyle = on ? '#fde047' : '#94a3b8';
    rrect(c, tx + 30, MID - 26, 14, 52, 5);
    c.fill();
    text(c, t('↔ σύρε τον φακό', '↔ drag the torch'), tx, MID + 60, 20, '#e2e8f0', 600);
  },
  btns(v) {
    const [, mat, on] = v;
    return row([
      { id: 'm0', label: t('⚽ αδιαφανές', '⚽ opaque'), w: 190, color: ORANGE, on: mat === 0 },
      { id: 'm1', label: t('🧻 ημιδιαφανές', '🧻 translucent'), w: 210, color: PURPLE, on: mat === 1 },
      { id: 'm2', label: t('🪟 διαφανές', '🪟 transparent'), w: 190, color: BLUE, on: mat === 2 },
      { id: 'on', label: on ? t('🔦 σβήσε', '🔦 off') : t('🔦 άναψε', '🔦 on'), w: 170, color: on ? '#475569' : '#ca8a04' },
    ], 18, 40);
  },
  press(v, id) {
    if (id[0] === 'm') return [v[0], +id[1], v[2]];
    if (id === 'on') return [v[0], v[1], 1 - v[2]];
    return null;
  },
  drag(v, x, y, st, first) {
    if (first && !(Math.abs(x - torchX(v[0])) < 80 && Math.abs(y - MID) < 60)) return null;
    if (first) st.on = 1;
    return [Math.round(clamp((x - 70) / 4.2, 0, 100)), v[1], v[2]];
  },
});

// ====================================================================================================
// Ανάκλαση και διάθλαση: καθρέφτης (γωνία πρόσπτωσης = γωνία ανάκλασης), νερό (η ακτίνα σπάει), πρίσμα (ουράνιο τόξο).
// v = [τρόπος 0 καθρέφτης / 1 νερό / 2 πρίσμα, γωνία πρόσπτωσης 15–75°]
// ====================================================================================================

const RAINBOW = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];

function ray(c: C, x0: number, y0: number, x1: number, y1: number, color: string, w = 8): void {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
  // βελάκι στη μέση: η φορά του φωτός
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, a = Math.atan2(y1 - y0, x1 - x0);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(mx + 16 * Math.cos(a), my + 16 * Math.sin(a));
  c.lineTo(mx + 14 * Math.cos(a + 2.5), my + 14 * Math.sin(a + 2.5));
  c.lineTo(mx + 14 * Math.cos(a - 2.5), my + 14 * Math.sin(a - 2.5));
  c.fill();
}
function angleArc(c: C, x: number, y: number, from: number, to: number, r: number, label: string, color: string): void {
  c.strokeStyle = color;
  c.lineWidth = 4;
  c.beginPath();
  c.arc(x, y, r, Math.min(from, to), Math.max(from, to));
  c.stroke();
  const m = (from + to) / 2;
  text(c, label, x + Math.cos(m) * (r + 30), y + Math.sin(m) * (r + 30), 24, color, 800);
}
function torch(c: C, x: number, y: number, a: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = '#64748b';
  rrect(c, -70, -16, 80, 32, 8);
  c.fill();
  c.fillStyle = '#fde047';
  rrect(c, 4, -22, 12, 44, 4);
  c.fill();
  c.restore();
}

const optics = lab({
  label: t('Ανάκλαση και διάθλαση', 'Reflection and refraction'), init: [0, 40],
  draw(c, v, env) {
    const [mode, deg] = v, a = (deg * Math.PI) / 180;
    frame(c, mode === 2 ? '#0f172a' : '#f8fafc', env);
    if (mode === 2) {
      // πρίσμα: το λευκό φως χωρίζεται στα χρώματα του ουράνιου τόξου
      const shift = (deg - 40) * 1.4;
      c.fillStyle = 'rgba(186, 230, 253, 0.35)';
      c.strokeStyle = '#e0f2fe';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(470, 110); c.lineTo(330, 420); c.lineTo(610, 420);
      c.closePath();
      c.fill();
      c.stroke();
      const ex = 405, ey = 270, xx = 535, xy = 290;
      ray(c, 60, 230 - shift, ex, ey, '#ffffff', 10);
      torch(c, 60, 230 - shift, Math.atan2(ey - 230 + shift, ex - 60));
      c.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      c.lineWidth = 8;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(xx, xy); c.stroke();
      RAINBOW.forEach((col, i) => ray(c, xx, xy, 900, 300 + i * 26 + shift * 0.8, col, 7));
      c.fillStyle = '#e2e8f0';
      c.fillRect(905, 260, 20, 280);
      return;
    }
    const P: [number, number] = [480, mode ? 300 : 440];
    if (mode === 1) {
      // νερό
      const g = c.createLinearGradient(0, P[1], 0, 528);
      g.addColorStop(0, '#7dd3fc');
      g.addColorStop(1, '#0284c7');
      c.fillStyle = g;
      c.fillRect(0, P[1], W0, 528 - P[1]);
      text(c, t('αέρας', 'air'), 80, P[1] - 30, 24, '#64748b', 700);
      text(c, t('νερό', 'water'), 80, P[1] + 34, 24, '#ffffff', 700);
    } else {
      // καθρέφτης
      c.fillStyle = '#cbd5e1';
      c.fillRect(160, P[1], 640, 16);
      c.strokeStyle = '#64748b';
      c.lineWidth = 3;
      for (let x = 170; x < 800; x += 22) { c.beginPath(); c.moveTo(x, P[1] + 16); c.lineTo(x - 14, P[1] + 34); c.stroke(); }
    }
    // κάθετη στο σημείο πρόσπτωσης
    c.setLineDash([10, 10]);
    c.strokeStyle = '#64748b';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(P[0], P[1] - 260);
    c.lineTo(P[0], mode ? P[1] + 220 : P[1]);
    c.stroke();
    c.setLineDash([]);
    const L = 330, sx = P[0] - L * Math.sin(a), sy = P[1] - L * Math.cos(a);
    ray(c, sx, sy, P[0], P[1], '#f59e0b');
    torch(c, sx, sy, Math.atan2(P[1] - sy, P[0] - sx));
    angleArc(c, P[0], P[1], -Math.PI / 2 - a, -Math.PI / 2, 80, `${deg}°`, '#d97706');
    if (mode === 0) {
      ray(c, P[0], P[1], P[0] + L * Math.sin(a), P[1] - L * Math.cos(a), '#f59e0b');
      angleArc(c, P[0], P[1], -Math.PI / 2, -Math.PI / 2 + a, 80, `${deg}°`, '#d97706');
    } else {
      // διάθλαση: στο νερό η ακτίνα πλησιάζει την κάθετη (ημ r = ημ i / 1,33)
      const r = Math.asin(Math.sin(a) / 1.33), rd = Math.round((r * 180) / Math.PI);
      ray(c, P[0], P[1], P[0] + 240 * Math.sin(r), P[1] + 240 * Math.cos(r), '#f59e0b');
      // αχνή ανάκλαση στην επιφάνεια
      c.globalAlpha = 0.3;
      ray(c, P[0], P[1], P[0] + 220 * Math.sin(a), P[1] - 220 * Math.cos(a), '#f59e0b', 5);
      c.globalAlpha = 1;
      angleArc(c, P[0], P[1], Math.PI / 2 - r, Math.PI / 2, 80, `${rd}°`, '#0369a1');
    }
  },
  btns(v) {
    const [mode, deg] = v;
    return row([
      { id: 'm0', label: t('🪞 καθρέφτης', '🪞 mirror'), w: 180, color: BLUE, on: mode === 0 },
      { id: 'm1', label: t('🌊 νερό', '🌊 water'), w: 140, color: '#0891b2', on: mode === 1 },
      { id: 'm2', label: t('🔺 πρίσμα', '🔺 prism'), w: 150, color: PURPLE, on: mode === 2 },
      { id: 'a-', label: '−', w: 70, color: '#475569', off: deg <= 15 },
      { id: 'aa', label: `${deg}°`, w: 100, color: '#d97706' },
      { id: 'a+', label: '+', w: 70, color: '#475569', off: deg >= 75 },
    ], 16, 40);
  },
  press(v, id) {
    if (id[0] === 'm') return [+id[1], v[1]];
    if (id === 'a-') return [v[0], Math.max(15, v[1] - 5)];
    if (id === 'a+') return [v[0], Math.min(75, v[1] + 5)];
    return null;
  },
  // σύρσιμο του φακού: η γωνία ακολουθεί το δάχτυλο (ανά 5°)
  drag(v, x, y, st, first) {
    if (v[0] === 2) return null;
    const P = [480, v[0] ? 300 : 440];
    if (y > P[1] || x > P[0]) return first ? null : v;
    if (first) st.on = 1;
    const deg = Math.round((Math.atan2(P[0] - x, P[1] - y) * 180) / Math.PI / 5) * 5;
    return [v[0], clamp(deg, 15, 75)];
  },
});

// ====================================================================================================
// Θερμότητα: νερό στο ποτήρι που ζεσταίνεται ή κρυώνει. Πάγος (στερεό), νερό (υγρό), ατμός (αέριο), το θερμόμετρο
// και, σε μεγέθυνση, τα μόρια. v = [θερμοκρασία −20…110 (ανά 10), τελευταία αλλαγή −1 κρύωμα / 0 / 1 ζέσταμα]
// ====================================================================================================

const TMIN = -20, TMAX = 110;
export const stateOf = (T: number): 0 | 1 | 2 => (T < 0 ? 0 : T < 100 ? 1 : 2);

function molecules(c: C, cx: number, cy: number, R: number, T: number, time: number): void {
  c.save();
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.fillStyle = '#ffffff';
  c.fill();
  c.lineWidth = 5;
  c.strokeStyle = '#94a3b8';
  c.stroke();
  c.clip();
  const st = stateOf(T), shake = 1 + (T - TMIN) / 20;
  const dot = (x: number, y: number): void => {
    c.beginPath();
    c.arc(x, y, 11, 0, Math.PI * 2);
    c.fillStyle = BLUE;
    c.fill();
  };
  if (st === 0) {
    // στερεό: σε σειρές, μόνο τρέμουν στη θέση τους
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) dot(cx - 60 + i * 30 + Math.sin(time * 9 + i * 3 + j) * shake, cy - 60 + j * 30 + Math.cos(time * 8 + i + j * 2) * shake);
  } else {
    // υγρό: κοντά αλλά κυλούν· αέριο: λίγα, μακριά και γρήγορα
    const n = st === 1 ? 20 : 8, sp = st === 1 ? 0.25 + T / 250 : 1.4;
    for (let i = 0; i < n; i++) {
      const k = i * 2.39996;
      const r = st === 1 ? R * 0.35 + (i % 4) * 12 : R * 0.75;
      const x = cx + Math.cos(k + time * sp * (1 + (i % 3) * 0.3)) * r * (st === 1 ? 1 : Math.abs(Math.sin(k * 3 + time)));
      const y = st === 1 ? cy + 20 + Math.sin(k * 2 + time * sp * 1.7) * R * 0.45 : cy + Math.sin(k + time * sp * 1.3) * r;
      dot(x, y);
    }
  }
  c.restore();
}

const heat = lab({
  label: t('Θερμότητα: πάγος, νερό, ατμός', 'Heat: ice, water, steam'), init: [20, 0],
  draw(c, v, env) {
    const time = sec(env);
    // η θερμοκρασία πάει ομαλά στη νέα τιμή
    const k = env.anim && env.anim.t < 1500 ? env.anim.t / 1500 : 1;
    const T = (env.anim?.prev[0] ?? v[0]) + (v[0] - (env.anim?.prev[0] ?? v[0])) * k;
    const st = stateOf(v[0]);
    frame(c, '#fff7ed', env);
    // φωτιά ή πάγος από κάτω
    if (v[1] > 0) {
      for (let i = 0; i < 5; i++) {
        const fx = 330 + i * 35, fh = 46 + Math.sin(time * 11 + i * 2) * 10;
        c.fillStyle = i % 2 ? ORANGE : YELLOW;
        c.beginPath();
        c.moveTo(fx - 16, 500);
        c.quadraticCurveTo(fx, 500 - fh * 1.6, fx + 16, 500);
        c.fill();
      }
    } else if (v[1] < 0) text(c, '❄️ ❄️ ❄️', 400, 495, 36);
    // ποτήρι
    const bx0 = 270, bx1 = 530, by0 = 130, by1 = 450;
    c.fillStyle = 'rgba(224, 242, 254, 0.5)';
    c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    const level = st === 2 && v[0] > 100 ? 0 : st === 0 ? 0 : 0.62;
    if (level) {
      const top = by1 - (by1 - by0) * level;
      c.fillStyle = '#7dd3fc';
      c.fillRect(bx0, top + Math.sin(time * 3) * 2, bx1 - bx0, by1 - top);
      if (st === 2) {
        // βρασμός: φυσαλίδες
        for (let i = 0; i < 14; i++) {
          const y = by1 - (((time * 90 + i * 37) % (by1 - top)));
          c.beginPath();
          c.arc(bx0 + 20 + ((i * 53) % (bx1 - bx0 - 40)), y, 5 + (i % 3) * 3, 0, Math.PI * 2);
          c.strokeStyle = '#ffffff';
          c.lineWidth = 3;
          c.stroke();
        }
      }
    }
    if (st === 0 || v[0] === 0) {
      // παγάκια
      for (const [x, y] of [[330, 380], [420, 395], [370, 320]] as [number, number][]) {
        const yy = v[0] === 0 ? y - 110 : y;
        c.fillStyle = '#e0f2fe';
        rrect(c, x, yy, 70, 60, 10);
        c.fill();
        c.strokeStyle = '#7dd3fc';
        c.lineWidth = 3;
        c.stroke();
        c.fillStyle = '#ffffff';
        c.fillRect(x + 10, yy + 10, 14, 8);
      }
    }
    if (st === 2) {
      // ατμός πάνω από το ποτήρι
      for (let i = 0; i < 6; i++) {
        const k2 = (time * 0.6 + i / 6) % 1;
        c.beginPath();
        c.arc(320 + i * 32 + Math.sin(time * 2 + i) * 14, by0 - k2 * 120, 18 + k2 * 16, 0, Math.PI * 2);
        c.fillStyle = `rgba(148, 163, 184, ${0.55 * (1 - k2)})`;
        c.fill();
      }
    }
    c.strokeStyle = '#475569';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(bx0, by0 - 10); c.lineTo(bx0, by1); c.lineTo(bx1, by1); c.lineTo(bx1, by0 - 10);
    c.stroke();
    // θερμόμετρο
    const ty0 = 80, ty1 = 440, yOf = (x: number): number => ty1 - ((x - TMIN) / (TMAX - TMIN + 10)) * (ty1 - ty0);
    c.fillStyle = '#ffffff';
    rrect(c, 615, ty0 - 20, 40, ty1 - ty0 + 30, 20);
    c.fill();
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 3;
    c.stroke();
    c.fillStyle = RED;
    c.fillRect(627, yOf(T), 16, ty1 - yOf(T));
    c.beginPath();
    c.arc(635, ty1 + 18, 26, 0, Math.PI * 2);
    c.fill();
    for (let x = TMIN; x <= TMAX; x += 20) {
      c.fillStyle = '#475569';
      c.fillRect(655, yOf(x) - 1, 14, 3);
      text(c, `${x}`, 695, yOf(x), 18, '#475569', 600);
    }
    text(c, `${Math.round(T)} °C`, 640, 38, 34, RED, 800);
    // τα μόρια σε μεγέθυνση, και τι είναι
    molecules(c, 830, 250, 105, T, time);
    const name = [t('στερεό (πάγος)', 'solid (ice)'), t('υγρό (νερό)', 'liquid (water)'), t('αέριο (ατμός)', 'gas (steam)')][st];
    text(c, name, 830, 390, 26, ['#0284c7', BLUE, '#64748b'][st], 800);
    const change = v[0] === 0 ? t('τήξη ↔ πήξη', 'melting ↔ freezing') : v[0] === 100 ? t('βρασμός', 'boiling') : '';
    if (change) text(c, change, 830, 428, 24, ORANGE, 800);
  },
  btns(v) {
    return row([
      { id: 'c', label: t('❄️ κρύωσε', '❄️ cool'), w: 220, color: BLUE, off: v[0] <= TMIN },
      { id: 'h', label: t('🔥 ζέστανε', '🔥 heat'), w: 220, color: RED, off: v[0] >= TMAX },
      { id: 'r', label: t('🔄 από την αρχή', '🔄 restart'), w: 240, color: '#475569' },
    ], 24, 60);
  },
  press(v, id) {
    if (id === 'c') return [Math.max(TMIN, v[0] - 10), -1];
    if (id === 'h') return [Math.min(TMAX, v[0] + 10), 1];
    if (id === 'r') return [TMIN, 0];
    return null;
  },
  fx: (prev, next) => (stateOf(prev[0]) !== stateOf(next[0]) || next[0] === 0 || next[0] === 100 ? 'pop' : 'click'),
});

// ====================================================================================================
// Μαγνήτης: οι πυξίδες δείχνουν πού πηγαίνει το πεδίο, τα ρινίσματα φτιάχνουν τις γραμμές του. Ο μαγνήτης σέρνεται
// και γυρίζει· ο ηλεκτρομαγνήτης (καρφί με πηνίο) γίνεται μαγνήτης μόνο όσο περνά ρεύμα. Μακριά, οι πυξίδες δείχνουν τον βορρά.
// v = [x 0–100, y 0–100, στροφή 0–7 (ανά 45°), ρινίσματα 0|1, ηλεκτρομαγνήτης 0|1, ρεύμα 0|1]
// ====================================================================================================

const MAG_L = 220;
const magCenter = (v: number[]): [number, number] => [140 + v[0] * 6.8, 90 + v[1] * 3.4];

/** Το πεδίο στο (x, y): οι δύο πόλοι του μαγνήτη, και ένα μικρό πεδίο της Γης προς τα πάνω (βορράς). */
export function field(v: number[], x: number, y: number): [number, number] {
  let bx = 0, by = -1.2;
  if (!v[4] || v[5]) {
    const [cx, cy] = magCenter(v), a = (v[2] * Math.PI) / 4;
    for (const [q, s] of [[1, 1], [-1, -1]]) {
      const px = cx + (s * MAG_L * 0.42) * Math.cos(a), py = cy + (s * MAG_L * 0.42) * Math.sin(a);
      const dx = x - px, dy = y - py, r3 = Math.max(30, Math.hypot(dx, dy)) ** 3;
      bx += (q * 4e5 * dx) / r3;
      by += (q * 4e5 * dy) / r3;
    }
  }
  return [bx, by];
}

function compass(c: C, x: number, y: number, b: [number, number]): void {
  c.beginPath();
  c.arc(x, y, 26, 0, Math.PI * 2);
  c.fillStyle = '#ffffff';
  c.fill();
  c.strokeStyle = '#94a3b8';
  c.lineWidth = 3;
  c.stroke();
  const a = Math.atan2(b[1], b[0]), ca = Math.cos(a), sa = Math.sin(a);
  // το κόκκινο άκρο (βόρειος πόλος της βελόνας) δείχνει τη φορά του πεδίου
  for (const [col, s] of [[RED, 1], [BLUE, -1]] as [string, number][]) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x + s * 21 * ca, y + s * 21 * sa);
    c.lineTo(x - 6 * sa, y + 6 * ca);
    c.lineTo(x + 6 * sa, y - 6 * ca);
    c.fill();
  }
}

const magnet = lab({
  label: t('Μαγνήτης και πυξίδες', 'Magnet and compasses'), init: [50, 50, 0, 0, 0, 1],
  draw(c, v, env) {
    frame(c, '#f8fafc', env);
    const [cx, cy] = magCenter(v), a = (v[2] * Math.PI) / 4, em = !!v[4];
    if (v[3] && (!em || v[5])) {
      // ρινίσματα σιδήρου: κοντές γραμμούλες στη διεύθυνση του πεδίου, πιο σκούρες όπου είναι δυνατό
      c.strokeStyle = '#334155';
      c.lineWidth = 2.5;
      for (let i = 0; i < 46; i++) for (let j = 0; j < 24; j++) {
        const x = 15 + i * 20 + ((j * 7) % 11), y = 15 + j * 21 + ((i * 5) % 9);
        const [bx, by] = field(v, x, y), m = Math.hypot(bx, by + 1.2);
        if (m < 1) continue;
        const k = 7 / Math.hypot(bx, by);
        c.globalAlpha = Math.min(0.85, m / 8);
        c.beginPath();
        c.moveTo(x - bx * k, y - by * k);
        c.lineTo(x + bx * k, y + by * k);
        c.stroke();
      }
      c.globalAlpha = 1;
    }
    // πυξίδες σε πλέγμα, όχι πάνω στον μαγνήτη
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
      const x = 75 + i * 102, y = 70 + j * 125;
      if (Math.hypot(x - cx, y - cy) < MAG_L * 0.62) continue;
      compass(c, x, y, field(v, x, y));
    }
    // ο μαγνήτης (ή το καρφί με το πηνίο)
    c.save();
    c.translate(cx, cy);
    c.rotate(a);
    if (em) {
      c.fillStyle = '#9ca3af';
      rrect(c, -MAG_L / 2, -14, MAG_L, 28, 6);
      c.fill();
      c.strokeStyle = '#c2410c';
      c.lineWidth = 6;
      for (let x = -MAG_L / 2 + 30; x < MAG_L / 2 - 20; x += 16) { c.beginPath(); c.moveTo(x, -24); c.lineTo(x + 8, 24); c.stroke(); }
      if (v[5]) {
        text(c, 'N', MAG_L / 2 - 14, -38, 26, RED, 800);
        text(c, 'S', -MAG_L / 2 + 14, -38, 26, BLUE, 800);
      }
    } else {
      c.fillStyle = BLUE;
      rrect(c, -MAG_L / 2, -26, MAG_L / 2, 52, 8);
      c.fill();
      c.fillStyle = RED;
      rrect(c, 0, -26, MAG_L / 2, 52, 8);
      c.fill();
      text(c, 'S', -MAG_L / 4, 2, 32, '#ffffff', 800);
      text(c, 'N', MAG_L / 4, 2, 32, '#ffffff', 800);
    }
    c.restore();
    if (em) {
      // μπαταρία και σύρματα του ηλεκτρομαγνήτη
      text(c, v[5] ? t('🔋 περνά ρεύμα', '🔋 current on') : t('🔋 χωρίς ρεύμα', '🔋 no current'), cx, cy + 70, 22, v[5] ? GREEN : '#64748b', 700);
    }
    text(c, t('↑ βορράς', '↑ north'), 900, 20, 18, '#64748b', 600);
  },
  btns(v) {
    return row([
      { id: 'rot', label: t('⟳ γύρισε', '⟳ turn'), w: 150, color: PURPLE },
      { id: 'fil', label: t('〰️ ρινίσματα', '〰️ filings'), w: 190, color: '#334155', on: !!v[3] },
      { id: 'em', label: v[4] ? t('🔩 ηλεκτρομαγνήτης', '🔩 electromagnet') : t('🧲 μαγνήτης', '🧲 magnet'), w: 250, color: v[4] ? ORANGE : RED },
      { id: 'cur', label: v[5] ? t('🔌 κλείσε ρεύμα', '🔌 current off') : t('🔌 άνοιξε ρεύμα', '🔌 current on'), w: 230, color: v[5] ? GREEN : '#475569', off: !v[4] },
    ], 16, 40);
  },
  press(v, id) {
    const o = [...v];
    if (id === 'rot') o[2] = (o[2] + 1) % 8;
    else if (id === 'fil') o[3] = 1 - o[3];
    else if (id === 'em') o[4] = 1 - o[4];
    else if (id === 'cur') o[5] = 1 - o[5];
    else return null;
    return o;
  },
  drag(v, x, y, st, first) {
    const [cx, cy] = magCenter(v);
    if (first) {
      if (Math.hypot(x - cx, y - cy) > MAG_L * 0.55) return null;
      st.dx = x - cx;
      st.dy = y - cy;
    }
    return [clamp(Math.round((x - st.dx - 140) / 6.8), 0, 100), clamp(Math.round((y - st.dy - 90) / 3.4), 0, 100), v[2], v[3], v[4], v[5]];
  },
});

export const SCIENCE_KIDS: Record<string, StampDef> = {
  'lab-circuit': circuit,
  'lab-sound': sound,
  'lab-light': light,
  'lab-optics': optics,
  'lab-heat': heat,
  'lab-magnet': magnet,
};
