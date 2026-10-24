/**
 * Τιμές στα σχήματα της μηχανικής (βλ. sim-def.ts), όπως στη Β΄ Γυμνασίου και στην Α΄ Λυκείου: κεκλιμένο επίπεδο, σώμα με τριβή,
 * κίνηση σε άξονα, ελεύθερη πτώση (με ενέργεια), υγρά (πίεση, άνωση), ελατήριο (Hooke) και δύο δυνάμεις (συνισταμένη).
 * g = 10 m/s² αν δεν δοθεί, όπως στα βιβλία. Οι συναρτήσεις κίνησης δίνουν και ό,τι χρειάζεται η σχεδίαση (physics.ts).
 */

import { t } from './i18n';
import { num } from './osc-sim';
import { simKit, type SimData, type SimDef, type SimQty } from './sim-def';
import type { SpringState } from './stamps';

const G = 10;
const q = (key: string, name: string, unit: string, is: RegExp, conv?: Record<string, number>, scale?: number): SimQty => ({ key, name, unit, is, conv, scale });
const M = q('m', 'm', 'kg', /^[mMΜ]$/, { g: 1e-3 });
const GQ = q('g', 'g', 'm/s²', /^g$/);
const MU = q('mu', 'μ', '', /^(μ|mu)$/);
const F = q('F', 'F', 'N', /^F$/, { kN: 1e3 });
const LEN = (key: string, name: string, is: RegExp) => q(key, name, 'm', is, { cm: 1e-2, mm: 1e-3, km: 1e3 });
const hint = (ex: string) => (): string => t(`Π.χ. ${ex} (SI· g = 10 αν δεν δοθεί). Κενό: χωρίς τιμές.`, `E.g. ${ex} (SI; g = 10 if not given). Empty: no values.`);
const rad = (deg: number): number => (deg * Math.PI) / 180;

/** Αν το σώμα κινείται υπό συνισταμένη `f` (θετική προς τη φορά της F) με μέγιστη στατική τριβή `Tmax`: τριβή, ΣF, a και τι κάνει. */
function friction(f: number, Tmax: number, m: number): { T: number; sum: number; a: number; moves: boolean } {
  if (Math.abs(f) <= Tmax + 1e-9) return { T: Math.abs(f), sum: 0, a: 0, moves: false };
  const sum = Math.abs(f) - Tmax;
  return { T: Tmax, sum, a: sum / m, moves: true };
}

/** Κεκλιμένο επίπεδο γωνίας φ: βάρος και συνιστώσες, κάθετη αντίδραση, τριβή (με μ), και αν το σώμα μένει, ανεβαίνει ή κατεβαίνει (F παράλληλη, προς τα πάνω). */
export function inclineDef(): SimDef {
  const qty = [M, q('phi', 'φ', '°', /^(φ|phi|θ)$/), MU, F, GQ];
  return {
    title: t('Τιμές του κεκλιμένου', 'Incline values'),
    hint: hint('m = 2 kg, φ = 30°, μ = 0,2, F = 15 N'),
    ...simKit(qty, num),
    answers(d) {
      if (!(d.m > 0) || d.phi === undefined) return [];
      const g = d.g ?? G, B = d.m * g, Bx = B * Math.sin(rad(d.phi)), By = B * Math.cos(rad(d.phi));
      const Tmax = (d.mu ?? 0) * By, f = (d.F ?? 0) - Bx;
      const r = friction(f, Tmax, d.m);
      const out = [`B = ${num(B)} N`, `Bx = ${num(Bx)} N`, `By = ${num(By)} N`, `N = ${num(By)} N`];
      if (d.mu !== undefined) out.push(`T = ${num(r.T)} N`);
      out.push(`ΣF = ${num(r.sum)} N`, `a = ${num(r.a)} m/s²`);
      out.push(!r.moves ? t('→ μένει ακίνητο', '→ stays at rest') : f > 0 ? t('→ ανεβαίνει', '→ moves up') : t('→ κατεβαίνει', '→ slides down'));
      return out;
    },
    aiNote: ', has values (give m, φ, μ, F)',
    beta: true,
  };
}

/** Σώμα σε οριζόντιο δάπεδο με οριζόντια F και τριβή: αν κινείται, η επιτάχυνση, και μετά από χρόνο t η ταχύτητα και η μετατόπιση (από την ηρεμία). */
export function frictionDef(): SimDef {
  const qty = [M, F, MU, q('t', 't', 's', /^t$/, { ms: 1e-3, min: 60 }), GQ];
  return {
    title: t('Τιμές του σώματος', 'Body values'),
    hint: hint('m = 4 kg, F = 20 N, μ = 0,25, t = 3 s'),
    ...simKit(qty, num),
    answers(d) {
      if (!(d.m > 0) || d.F === undefined) return [];
      const B = d.m * (d.g ?? G), Tmax = (d.mu ?? 0) * B;
      const r = friction(d.F, Tmax, d.m);
      const out = [`B = ${num(B)} N`, `N = ${num(B)} N`];
      if (d.mu !== undefined) out.push(`T = ${num(r.T)} N`);
      out.push(`ΣF = ${num(r.sum)} N`, `a = ${num(r.a)} m/s²`);
      if (!r.moves) out.push(t('→ μένει ακίνητο', '→ stays at rest'));
      else if (d.t !== undefined) out.push(`υ = ${num(r.a * d.t)} m/s`, `Δx = ${num(0.5 * r.a * d.t * d.t)} m`);
      return out;
    },
    aiNote: ', has values (give m, F, μ)',
    beta: true,
  };
}

// ---------- κίνηση σε άξονα ----------

/** Πόσο κρατά η κίνηση στον πίνακα (s): τόσο δείχνουν και τα διαγράμματα. */
export const MOTION_T = 10;
/** Θέση και ταχύτητα τη στιγμή t (ευθύγραμμη ομαλά μεταβαλλόμενη). */
export const motionAt = (d: SimData, tt: number): { x: number; v: number } => {
  const x0 = d.x0 ?? 0, v0 = d.v0 ?? 0, a = d.a ?? 0;
  return { x: x0 + v0 * tt + 0.5 * a * tt * tt, v: v0 + a * tt };
};
/** Ο χρόνος της κίνησης στο σχήμα (s), από το st.t του ▶ (ms)· 0 όσο είναι ακίνητο. */
export const motionTime = (st?: SpringState): number => (st?.t === undefined ? 0 : Math.min(MOTION_T, st.t / 1000));

export function motionDef(): SimDef {
  const qty = [LEN('x0', 'x₀', /^x0$/), q('v0', 'υ₀', 'm/s', /^[υuv]0$/, { 'km/h': 1 / 3.6 }), q('a', 'a', 'm/s²', /^[aα]$/), q('t', 't', 's', /^t$/)];
  return {
    title: t('Τιμές της κίνησης', 'Motion values'),
    hint: hint('x₀ = 0, υ₀ = 2 m/s, a = 1 m/s², t = 4 s'),
    ...simKit(qty, num),
    answers(d) {
      if (d.v0 === undefined && d.a === undefined) return [];
      const out = [`x = ${num(d.x0 ?? 0)} + ${num(d.v0 ?? 0)}·t + ${num((d.a ?? 0) / 2)}·t²`, `υ = ${num(d.v0 ?? 0)} + ${num(d.a ?? 0)}·t`];
      if (d.t !== undefined) {
        const r = motionAt(d, d.t);
        out.push(`x(${num(d.t)}) = ${num(r.x)} m`, `υ(${num(d.t)}) = ${num(r.v)} m/s`, `Δx = ${num(r.x - (d.x0 ?? 0))} m`);
      }
      return out;
    },
    live(d, st) {
      if (st.t === undefined) return null;
      const tt = motionTime(st), r = motionAt(d, tt);
      return `t = ${num(tt)} s · x = ${num(r.x)} m · υ = ${num(r.v)} m/s`;
    },
    aiNote: ', has values and moves with ▶ (give x₀, υ₀, a)',
    beta: true,
  };
}

// ---------- ελεύθερη πτώση ----------

/** Ο χρόνος της πτώσης από ύψος h (s). */
export const fallT = (d: SimData): number => Math.sqrt((2 * (d.h ?? 20)) / (d.g ?? G));
/** Ύψος και ταχύτητα τη στιγμή tt (το σώμα σταματά στο έδαφος). */
export const fallAt = (d: SimData, tt: number): { y: number; v: number } => {
  const g = d.g ?? G, T = fallT(d), u = Math.min(tt, T);
  return { y: (d.h ?? 20) - 0.5 * g * u * u, v: g * u };
};

export function fallDef(): SimDef {
  const qty = [LEN('h', 'h', /^[hH]$/), M, GQ];
  return {
    title: t('Τιμές της πτώσης', 'Fall values'),
    hint: hint('h = 20 m, m = 2 kg'),
    ...simKit(qty, num),
    answers(d) {
      if (!(d.h > 0)) return [];
      const g = d.g ?? G, T = fallT(d);
      const out = [`t = ${num(T)} s`, `υ = ${num(g * T)} m/s`];
      // ενέργεια: όλη η δυναμική γίνεται κινητική
      if (d.m > 0) out.push(`U = ${num(d.m * g * d.h)} J`, `K${t('τελ', 'end')} = ${num(d.m * g * d.h)} J`);
      return out;
    },
    live(d, st) {
      if (st.t === undefined || !(d.h > 0)) return null;
      const tt = Math.min(st.t / 1000, fallT(d)), r = fallAt(d, tt), g = d.g ?? G;
      const e = d.m > 0 ? ` · U = ${num(d.m * g * r.y)} J · K = ${num(0.5 * d.m * r.v * r.v)} J` : '';
      return `t = ${num(tt)} s · y = ${num(r.y)} m · υ = ${num(r.v)} m/s${e}`;
    },
    aiNote: ', has values and falls with ▶ (give h, m)',
    beta: true,
  };
}

// ---------- υγρά: πίεση, άνωση ----------

/** Τι κάνει το σώμα στο υγρό: 1 επιπλέει, −1 βυθίζεται, 0 ισορροπεί μέσα, null αν δεν ξέρουμε. */
export function floats(d: SimData): 1 | -1 | 0 | null {
  const rs = d.rs ?? (d.m && d.V ? d.m / d.V : undefined);
  if (rs === undefined) return null;
  const r = d.rho ?? 1000;
  return Math.abs(rs - r) < 1e-9 * r ? 0 : rs < r ? 1 : -1;
}

export function fluidDef(): SimDef {
  const qty = [
    q('rho', 'ρυγρ', 'kg/m³', /^ρ(υγρ\p{L}*|υ|L|l)?$/u, { 'g/cm³': 1000 }),
    LEN('h', 'h', /^[hH]$/),
    q('V', 'V', 'm³', /^V$/, { L: 1e-3, l: 1e-3, 'cm³': 1e-6, 'dm³': 1e-3 }),
    M,
    q('rs', 'ρσ', 'kg/m³', /^ρ(σ\p{L}*|s|Σ)$/u, { 'g/cm³': 1000 }),
    GQ,
  ];
  return {
    title: t('Τιμές του υγρού', 'Liquid values'),
    hint: hint('ρυγρ = 1000 kg/m³, h = 2 m, V = 2 L, m = 3 kg'),
    ...simKit(qty, num),
    answers(d) {
      const g = d.g ?? G, rho = d.rho ?? 1000, out: string[] = [];
      if (d.h !== undefined) out.push(`p = ${num(rho * g * d.h)} Pa`);
      if (d.V !== undefined) out.push(`${t('Α', 'B')} = ${num(rho * g * d.V)} N`);
      const m = d.m ?? (d.rs && d.V ? d.rs * d.V : undefined);
      if (m !== undefined) out.push(`B = ${num(m * g)} N`);
      if (m !== undefined && d.V !== undefined) {
        out.push(`B${t('φ', 'app')} = ${num(Math.max(0, m * g - rho * g * d.V))} N`, `ρσ = ${num(m / d.V)} kg/m³`);
      }
      const f = floats(d);
      if (f !== null) out.push(f > 0 ? t('→ επιπλέει', '→ floats') : f < 0 ? t('→ βυθίζεται', '→ sinks') : t('→ ισορροπεί μέσα στο υγρό', '→ stays where it is'));
      return out;
    },
    aiNote: ', has values (give ρ, h, V, m)',
    beta: true,
  };
}

// ---------- ελατήριο (Hooke) ----------

/** Η επιμήκυνση (m): Δl = F / k, με F = mg αν δόθηκε μάζα. */
export const hookeDl = (d: SimData): number | null => {
  const Fv = d.F ?? (d.m !== undefined ? d.m * (d.g ?? G) : undefined);
  return Fv !== undefined && d.k > 0 ? Fv / d.k : null;
};

export function hookeDef(): SimDef {
  const qty = [q('k', 'k', 'N/m', /^[kKΚD]$/), M, F, LEN('L0', 'L₀', /^(L0|l0|ℓ0)$/), GQ];
  return {
    title: t('Τιμές του ελατηρίου', 'Spring values'),
    hint: hint('k = 50 N/m, m = 0,5 kg, L₀ = 20 cm'),
    ...simKit(qty, num),
    answers(d) {
      const dl = hookeDl(d);
      if (dl === null) return [];
      const Fv = d.F ?? d.m! * (d.g ?? G);
      const out = [`F = ${num(Fv)} N`, `Δl = ${num(dl)} m`];
      if (d.L0 !== undefined) out.push(`L = ${num(d.L0 + dl)} m`);
      return out;
    },
    aiNote: ', has values (give k, m or F, L₀)',
    beta: true,
  };
}

// ---------- δύο δυνάμεις ----------

/** Η συνισταμένη δύο δυνάμεων με γωνία θ: μέτρο και γωνία με την F₁ (°). */
export function resultant(F1: number, F2: number, th: number): { R: number; phi: number } {
  const a = rad(th);
  return { R: Math.sqrt(F1 * F1 + F2 * F2 + 2 * F1 * F2 * Math.cos(a)), phi: (Math.atan2(F2 * Math.sin(a), F1 + F2 * Math.cos(a)) * 180) / Math.PI };
}

export function forcesDef(): SimDef {
  const qty = [q('F1', 'F₁', 'N', /^F1$/), q('F2', 'F₂', 'N', /^F2$/), q('th', 'θ', '°', /^(θ|φ|theta)$/)];
  return {
    title: t('Τιμές των δυνάμεων', 'Force values'),
    hint: hint('F₁ = 3 N, F₂ = 4 N, θ = 90°'),
    ...simKit(qty, num),
    answers(d) {
      if (d.F1 === undefined || d.F2 === undefined || d.th === undefined) return [];
      const r = resultant(d.F1, d.F2, d.th);
      return [`R = ${num(r.R)} N`, `${t('γωνία R με F₁', 'angle R–F₁')} = ${num(r.phi)}°`, `${t('ισορροπία', 'equilibrium')}: F₃ = ${num(r.R)} N`];
    },
    aiNote: ', has values (give F₁, F₂, θ)',
    beta: true,
  };
}
