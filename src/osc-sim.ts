/**
 * Προσομοίωση απλής αρμονικής ταλάντωσης για τα ελατήρια και το εκκρεμές. Τα δεδομένα μπορεί να είναι όποια δίνει η άσκηση
 * (m, k, A, L, g, T, f, ω, E, υmax, amax, Fmax, Fελ, Δl)· από αυτά βγαίνουν τα m, k (ή L), A και ω, και από εκεί όλα τα υπόλοιπα.
 */

import { locale, t } from './i18n';
import type { SimDef } from './sim-def';
import type { SpringState } from './stamps';

/** Τα δεδομένα όπως τα έδωσε ο χρήστης (SI). w = ω, E = ολική ενέργεια, v = υmax, a = amax, F = μέγιστη δύναμη επαναφοράς, Fel = μέγιστη δύναμη ελατηρίου, dl = Δl στη θέση ισορροπίας. */
export type OscSim = {
  m?: number; k?: number; A?: number; L?: number; g?: number;
  T?: number; f?: number; w?: number; E?: number; v?: number; a?: number; F?: number; Fel?: number; dl?: number;
};
type Key = keyof OscSim;

/** Το g όταν δεν δίνεται: όπως στα σχολικά βιβλία. */
export const G_DEFAULT = 10;

/** Πώς γράφεται κάθε μέγεθος (και ξαναδιαβάζεται) και η μονάδα του. */
const NAME: Record<Key, [string, string]> = {
  m: ['m', 'kg'], k: ['k', 'N/m'], A: ['A', 'm'], L: ['L', 'm'], g: ['g', 'm/s²'],
  T: ['T', 's'], f: ['f', 'Hz'], w: ['ω', 'rad/s'], E: ['E', 'J'], v: ['υmax', 'm/s'], a: ['amax', 'm/s²'],
  F: ['Fmax', 'N'], Fel: ['Fελ,max', 'N'], dl: ['Δl', 'm'],
};
const ORDER: Key[] = ['m', 'k', 'L', 'g', 'A', 'T', 'f', 'w', 'E', 'v', 'a', 'F', 'Fel', 'dl'];

/** Το όνομα ενός μεγέθους, όπως γράφεται σε εκφώνηση ή βγαίνει από την αναγνώριση χειρογράφου, σε κλειδί. */
function keyOf(raw: string): Key | null {
  // δείκτες και κόμματα δεν μετρούν: «E_{ολ}», «Fελ,max», «υ max»
  const n = raw.replace(/[_{}\s,]/g, '');
  if (/^[mMΜ]$/.test(n)) return 'm';
  if (/^[kKΚD]$/.test(n)) return 'k';
  if (/^[AΑ]$/.test(n)) return 'A';
  if (/^[Llℓ]$/.test(n)) return 'L';
  if (n === 'g') return 'g';
  if (/^[TΤ]$/.test(n)) return 'T';
  if (n === 'f') return 'f';
  if (n === 'ω') return 'w';
  // και με λατινικά: «E_t», «Etot», «Eολ»
  if (/^[EΕ](τ|T|t|ολ|ταλ|μηχ|tot|ol)?$/.test(n)) return 'E';
  if (/^[υuv](max|μεγ|0|ο)$/.test(n)) return 'v';
  if (/^[aα](max|μεγ)$/.test(n)) return 'a';
  if (/^Fελ(max|μεγ)?$/.test(n)) return 'Fel';
  if (/^Σ?F(επ\p{L}*)?(max|μεγ)?$/u.test(n)) return 'F';
  if (/^Δ[lℓLx]$/.test(n)) return 'dl';
  return null;
}

/**
 * Διαβάζει τα δεδομένα από κείμενο εκφώνησης ή από το πλαίσιο: «m = 200 g, D = 80 N/m, Eτ = 20 J, f = 2 Hz…»
 * (δεκαδικά με κόμμα ή τελεία· γραμμάρια, εκατοστά, χιλιοστά και ms γίνονται SI). Ό,τι λείπει μένει κενό.
 */
export function parseSim(s: string): OscSim {
  const out: OscSim = {};
  const re = /(?:^|[^\p{L}\d_])([ΣΔ]?\p{L}[\p{L}_{}]*(?:\s*,\s*(?:max|μεγ))?)\s*=\s*(\d+(?:[.,]\d+)?)\s*(\p{L}[\p{L}/²]*)?/gu;
  for (const m of s.matchAll(re)) {
    const k = keyOf(m[1]);
    if (!k) continue;
    let v = parseFloat(m[2].replace(',', '.'));
    const unit = m[3];
    if (unit === 'g' && k === 'm') v /= 1000;
    else if (unit === 'cm' && (k === 'A' || k === 'L' || k === 'dl')) v /= 100;
    else if (unit === 'mm' && (k === 'A' || k === 'L' || k === 'dl')) v /= 1000;
    else if (unit === 'ms' && k === 'T') v /= 1000;
    if (v > 0 && out[k] === undefined) out[k] = v;
  }
  return out;
}

/** Η αντίστροφη του parseSim, για να ξαναγράφεται στο πλαίσιο. */
export function simText(s: OscSim | undefined): string {
  if (!s) return '';
  return ORDER.filter((k) => s[k] !== undefined).map((k) => `${NAME[k][0]} = ${num(s[k]!)}`).join(', ');
}

/** Τα δεδομένα με τις μονάδες τους, σε μία γραμμή («m = 2 kg · k = 100 N/m · E = 20 J»)· κενό αν δεν υπάρχουν. */
export function dataLine(s: OscSim | undefined): string {
  if (!s) return '';
  return ORDER.filter((k) => s[k] !== undefined).map((k) => `${NAME[k][0]} = ${num(s[k]!)} ${NAME[k][1]}`).join(' · ');
}

/** Τα βασικά μεγέθη που βγαίνουν από τα δεδομένα: m, k (ελατήριο) ή L (εκκρεμές), A, ω και g. */
export interface Solved { m?: number; k?: number; L?: number; A?: number; w?: number; g: number }

/**
 * Από όποιο συνδυασμό δεδομένων: ω από T, f, k/m ή g/L (ή g/Δl)· k ή m από τα άλλα δύο· A από E, υmax, amax, Fmax ή Fελ.
 * Οι σχέσεις εφαρμόζονται ξανά και ξανά, ώστε ό,τι βρεθεί να βοηθά να βρεθούν τα επόμενα.
 */
export function solve(s: OscSim | undefined, pendulum: boolean, vertical = false): Solved {
  const g = s?.g ?? G_DEFAULT;
  const r: Solved = { g, m: s?.m, k: s?.k, L: s?.L, A: s?.A, w: s?.w };
  if (!s) return r;
  if (!r.w && s.T) r.w = (2 * Math.PI) / s.T;
  if (!r.w && s.f) r.w = 2 * Math.PI * s.f;
  // amax = ω·υmax
  if (!r.w && s.v && s.a) r.w = s.a / s.v;
  for (let i = 0; i < 4; i++) {
    if (pendulum) {
      if (!r.w && r.L) r.w = Math.sqrt(g / r.L);
      if (!r.L && r.w) r.L = g / (r.w * r.w);
    } else {
      if (!r.w && r.k && r.m) r.w = Math.sqrt(r.k / r.m);
      if (!r.w && s.dl && vertical) r.w = Math.sqrt(g / s.dl);
      if (!r.k && r.m && r.w) r.k = r.m * r.w * r.w;
      if (!r.m && r.k && r.w) r.m = r.k / (r.w * r.w);
      // κατακόρυφο: στη θέση ισορροπίας kΔl = mg
      if (s.dl && vertical) {
        if (!r.k && r.m) r.k = (r.m * g) / s.dl;
        if (!r.m && r.k) r.m = (r.k * s.dl) / g;
      }
    }
    // σταθερά επαναφοράς: k στο ελατήριο, mω² στο εκκρεμές
    const D = pendulum ? (r.m && r.w ? r.m * r.w * r.w : undefined) : r.k;
    if (!r.A) {
      if (s.E && D) r.A = Math.sqrt((2 * s.E) / D);
      else if (s.v && r.w) r.A = s.v / r.w;
      else if (s.a && r.w) r.A = s.a / (r.w * r.w);
      else if (s.F && D) r.A = s.F / D;
      // η μέγιστη δύναμη του ελατηρίου: kA οριζόντια, k(Δl + A) = mg + kA κατακόρυφα
      else if (s.Fel && r.k && !pendulum) r.A = vertical ? (r.m ? (s.Fel - r.m * g) / r.k : undefined) : s.Fel / r.k;
      if (r.A !== undefined && !(r.A > 0)) r.A = undefined;
    }
    if (r.A && !pendulum) {
      if (!r.k && s.E) r.k = (2 * s.E) / (r.A * r.A);
      if (!r.k && s.F) r.k = s.F / r.A;
      if (!r.k && s.Fel && !vertical) r.k = s.Fel / r.A;
    }
    if (r.A && !r.w) {
      if (s.v) r.w = s.v / r.A;
      else if (s.a) r.w = Math.sqrt(s.a / r.A);
    }
    if (pendulum && !r.m && s.E && r.A && r.w) r.m = (2 * s.E) / (r.w * r.w * r.A * r.A);
  }
  return r;
}

/** Κυκλική συχνότητα (rad/s), ή null αν λείπουν δεδομένα. */
export function omega(s: OscSim | undefined, pendulum: boolean, vertical = false): number | null {
  return solve(s, pendulum, vertical).w ?? null;
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Αριθμός με τρία σημαντικά ψηφία, με το κόμμα της γλώσσας· πολύ μεγάλοι ή πολύ μικροί όπως στα βιβλία, 2·10⁶ ή 1,5·10⁻⁴. */
export function num(v: number): string {
  if (!isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e5 || (a > 0 && a < 1e-3)) {
    const e = Math.floor(Math.log10(Number(a.toPrecision(3))));
    const m = num(v / 10 ** e);
    const p = [...String(Math.abs(e))].map((c) => SUP[+c]).join('');
    return `${m === '1' ? '' : m === '-1' ? '-' : `${m}·`}10${e < 0 ? '⁻' : ''}${p}`;
  }
  const r = Number(v.toPrecision(3));
  return (Object.is(r, -0) ? 0 : r).toLocaleString(locale, { maximumFractionDigits: 6 });
}

/** Ο αριθμός είναι (σχεδόν ακριβώς) αυτός, ώστε να μη γράφεται «π» από σύμπτωση. */
const same = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));

/** Ο συντελεστής του π σε απλή μορφή: [αριθμητής, παρονομαστής] (2, π/2, 3π/4, 2π/7) ή δεκαδικός (0,2π)· null αν δεν είναι απλός. */
function coef(c: number): [string, number] | null {
  // ακέραιος ή κλάσμα με μικρό παρονομαστή (π/5, π/10)· τα 3/10, 2/5 γράφονται όπως στα βιβλία, 0,3π
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(c * q);
    if (p === 0 || !same(p / q, c)) continue;
    if (q <= 4 || p === 1 || !same(Number(c.toPrecision(3)), c)) return [String(p), q];
    break;
  }
  if (same(Number(c.toPrecision(3)), c)) return [num(c), 1];
  return null;
}

/**
 * Τιμή που βγαίνει με π, όπως τη γράφει ο δάσκαλος: «2π», «π/2», «1/(2π)», «4π²», «0,2π ≈ 0,628»· αλλιώς όπως num().
 * Το «≈» μπαίνει όταν η μορφή δεν είναι απλό πολλαπλάσιο ή κλάσμα του π.
 */
export function piNum(v: number): string {
  if (!isFinite(v) || v <= 0 || same(Number(v.toPrecision(3)), v)) return num(v);
  for (const n of [1, -1, 2, -2]) {
    const c = coef(v / Math.PI ** n);
    if (!c) continue;
    const [p, q] = c;
    const pi = Math.abs(n) === 2 ? 'π²' : 'π';
    let s: string;
    if (n > 0) s = `${p === '1' ? '' : p}${pi}${q > 1 ? `/${q}` : ''}`;
    else s = q > 1 ? `${p}/(${q}${pi})` : `${p}/${pi}`;
    const plain = n === 1 && /^\d+$/.test(p);
    return plain ? s : `${s} ≈ ${num(v)}`;
  }
  return num(v);
}

/**
 * Ό,τι βγαίνει από τα δεδομένα, μία τιμή ανά στοιχείο: πρώτα τα βασικά που δεν δόθηκαν (k, m, L, A), μετά T, f, ω, υmax, amax, E
 * (και Δl στο κατακόρυφο). Ό,τι δόθηκε ήδη δεν ξαναγράφεται· ό,τι βγαίνει με π κρατά το π («T = 2π s»).
 */
export function simLines(s: OscSim | undefined, pendulum: boolean, vertical = false): string[] {
  if (!s) return [];
  const r = solve(s, pendulum, vertical);
  const out: string[] = [];
  const add = (k: Key, v: number | undefined): void => {
    if (v !== undefined && s[k] === undefined) out.push(`${NAME[k][0]} = ${piNum(v)} ${NAME[k][1]}`);
  };
  if (pendulum) add('L', r.L);
  else add('k', r.k);
  add('m', r.m);
  add('A', r.A);
  const w = r.w;
  if (!w) return out;
  add('T', (2 * Math.PI) / w);
  add('f', w / (2 * Math.PI));
  add('w', w);
  if (r.A) {
    add('v', w * r.A);
    add('a', w * w * r.A);
    const D = pendulum ? (r.m ? r.m * w * w : undefined) : r.k;
    if (D) add('E', 0.5 * D * r.A * r.A);
    if (D) add('F', D * r.A);
  }
  if (vertical && r.k && r.m) add('dl', (r.m * r.g) / r.k);
  return out;
}

/** Οι τιμές της στιγμής: σε θέση x = A·r (r από −1 έως 1), με φάση ph όσο ταλαντώνεται, αλλιώς ακίνητο σε εκείνη τη θέση. */
export function liveLine(s: OscSim | undefined, pendulum: boolean, r: number, ph?: number, fade = 1, vertical = false): string | null {
  const { w, A } = solve(s, pendulum, vertical);
  if (!w || !A) return null;
  const x = A * r;
  // όσο κινείται: υ = −ωA·sin(ωt)· ακίνητο σε θέση: το μέτρο της ταχύτητας που θα είχε εκεί, |υ| = ω√(A² − x²)
  const v = ph === undefined ? null : -w * A * fade * Math.sin(ph);
  const speed = v === null ? `|υ| = ${num(w * Math.sqrt(Math.max(0, A * A - x * x)))} m/s` : `υ = ${num(v)} m/s`;
  return `x = ${num(x)} m · ${speed} · a = ${num(-w * w * x)} m/s²`;
}

/** Περίοδος της κίνησης στον πίνακα (ms): η πραγματική, μέσα σε λογικά όρια ώστε να φαίνεται. */
export function periodMs(s: OscSim | undefined, pendulum: boolean, vertical = false): number | null {
  const w = omega(s, pendulum, vertical);
  return w ? Math.min(12000, Math.max(250, (2000 * Math.PI) / w)) : null;
}

export const SIM_HINT = (pendulum: boolean): string => pendulum
  ? t('Π.χ. L = 1, A = 0,05 ή T = 2, Eτ = 0,1, m = 0,5 (SI· g = 10 αν δεν δοθεί). Κενό: χωρίς τιμές.', 'E.g. L = 1, A = 0.05 or T = 2, E = 0.1, m = 0.5 (SI; g = 10 if not given). Empty: no values.')
  : t('Π.χ. m = 2, k = 100, Eτ = 20 ή f = 2, υmax = 1, Fελ = 30, Δl = 10 cm (SI· g = 10 αν δεν δοθεί). Κενό: χωρίς τιμές.', 'E.g. m = 2, k = 100, E = 20 or f = 2, vmax = 1, Fel = 30, Δl = 10 cm (SI; g = 10 if not given). Empty: no values.');

/** Η θέση του σώματος ως κλάσμα του πλάτους (−1 έως 1): όσο ταλαντώνεται από τη φάση, ακίνητο από τη θέση όπου κρατιέται. */
function liveR(st: SpringState): number {
  return st.ph !== undefined ? Math.cos(st.ph) * (st.fade ?? 1) : st.pinned && st.amp ? st.d / st.amp : 0;
}

/**
 * Οι τιμές της ταλάντωσης ως ορισμός σχήματος (βλ. sim-def.ts): 'h' οριζόντιο ή σε κεκλιμένο, 'v' κατακόρυφο, 'p' εκκρεμές.
 * `gap`: πόσο κάτω από το σχήμα αρχίζει το πλαίσιο των τιμών.
 */
export function oscDef(kind: 'h' | 'v' | 'p', gap = 1.4): SimDef {
  const pend = kind === 'p', vert = kind === 'v';
  return {
    title: t('Δεδομένα της ταλάντωσης', 'Oscillation data'),
    hint: () => SIM_HINT(pend),
    parse: parseSim,
    text: simText,
    dataLine,
    answers: (d) => simLines(d, pend, vert),
    live: (d, st) => (st.ph !== undefined || st.pinned ? liveLine(d, pend, liveR(st), st.ph, st.fade, vert) : null),
    periodMs: (d) => periodMs(d, pend, vert),
    gap,
    aiNote: ', oscillates (give its data)',
  };
}
