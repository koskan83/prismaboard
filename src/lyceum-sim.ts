/**
 * Τιμές στα σχήματα της Β΄ Λυκείου Προσανατολισμού (βολή, κυκλική, κρούσεις, αέρια, p–V, βαρύτητα) και της Γ΄ Λυκείου
 * (κρούση και ταλάντωση, συντονισμός, κύματα, συμβολή, στάσιμα, ροπή, μαγνητικό πεδίο, επαγωγή, φωτοηλεκτρικό). Βλ. sim-def.ts.
 * Μόνο όσα είναι στην ύλη (π.χ. χωρίς ln στη θερμοδυναμική, συμβολή μόνο με σύγχρονες πηγές). g = 10 m/s² αν δεν δοθεί.
 */

import { t } from './i18n';
import { num, piNum } from './osc-sim';
import { simKit, type SimData, type SimDef, type SimQty } from './sim-def';

const G = 10, PI = Math.PI;
const q = (key: string, name: string, unit: string, is: RegExp, conv?: Record<string, number>, scale?: number): SimQty => ({ key, name, unit, is, conv, scale });
const M = (i = '') => q(`m${i}`, `m${i ? '₀₁₂'[+i] : ''}`, 'kg', new RegExp(`^[mMΜ]${i}$`), { g: 1e-3 });
const V = (i = '', name = 'υ') => q(`v${i}`, `${name}${i ? '₀₁₂'[+i] : ''}`, 'm/s', new RegExp(`^[υuv]${i}$`), { 'km/h': 1 / 3.6 });
const LEN = (key: string, name: string, is: RegExp) => q(key, name, 'm', is, { cm: 1e-2, mm: 1e-3, km: 1e3 });
const GQ = q('g', 'g', 'm/s²', /^g$/);
const hint = (ex: string) => (): string => t(`Π.χ. ${ex} (SI). Κενό: χωρίς τιμές.`, `E.g. ${ex} (SI). Empty: no values.`);
/** Ορισμός με κοινά: πίνακας μεγεθών, παράθυρο, και beta πρώτα. */
const def = (title: string, ex: string, qty: SimQty[], answers: (d: SimData) => string[], aiNote: string, extra: Partial<SimDef> = {}): SimDef =>
  ({ title, hint: hint(ex), ...simKit(qty, num), answers, aiNote, beta: true, ...extra });

// ====================================================================================================
// Β΄ Λυκείου Προσανατολισμού
// ====================================================================================================

/** Οριζόντια βολή από ύψος h με υ₀: χρόνος, βεληνεκές, ταχύτητα και γωνία στο έδαφος. */
export const projectileDef = (): SimDef => def(t('Τιμές της βολής', 'Projectile values'), 'υ0 = 10 m/s, h = 20 m', [V('0', 'υ'), LEN('h', 'h', /^[hH]$/), GQ], (d) => {
  if (!(d.h > 0) || d.v0 === undefined) return [];
  const g = d.g ?? G, T = Math.sqrt((2 * d.h) / g), vy = g * T;
  return [`t = ${num(T)} s`, `x${t('max', 'max')} = ${num(d.v0 * T)} m`, `υy = ${num(vy)} m/s`, `υ = ${num(Math.hypot(d.v0, vy))} m/s`, `${t('εφθ', 'tanθ')} = ${num(vy / d.v0)}`];
}, ', has values and moves with ▶ (give υ₀, h)');

/** Ομαλή κυκλική κίνηση: από R και T (ή f, ω, υ) τα υπόλοιπα, κεντρομόλος και στροφορμή (με μάζα). */
export const circularDef = (): SimDef => def(t('Τιμές της κυκλικής', 'Circular motion values'), 'R = 2 m, T = 4 s, m = 1 kg',
  [LEN('R', 'R', /^[Rr]$/), q('T', 'T', 's', /^T$/), q('f', 'f', 'Hz', /^f$/), q('w', 'ω', 'rad/s', /^ω$/), V(), M()], (d) => {
    if (!(d.R > 0)) return [];
    const w = d.w ?? (d.T ? (2 * PI) / d.T : d.f ? 2 * PI * d.f : d.v ? d.v / d.R : undefined);
    if (!w) return [];
    const v = w * d.R, ac = w * w * d.R;
    const out: string[] = [];
    if (d.T === undefined) out.push(`T = ${piNum((2 * PI) / w)} s`);
    if (d.f === undefined) out.push(`f = ${piNum(w / (2 * PI))} Hz`);
    if (d.w === undefined) out.push(`ω = ${piNum(w)} rad/s`);
    if (d.v === undefined) out.push(`υ = ${piNum(v)} m/s`);
    out.push(`a${t('κ', 'c')} = ${piNum(ac)} m/s²`);
    if (d.m > 0) out.push(`F${t('κ', 'c')} = ${piNum(d.m * ac)} N`, `L = ${piNum(d.m * v * d.R)} kg·m²/s`);
    return out;
  }, ', has values and moves with ▶ (give R, T, m)');

/** Κεντρική κρούση: πριν, και μετά αν είναι πλαστική ή ελαστική (θετική φορά προς τα δεξιά). */
export const collisionDef = (): SimDef => def(t('Τιμές της κρούσης', 'Collision values'), 'm1 = 2 kg, υ1 = 3 m/s, m2 = 1 kg, υ2 = -1 m/s',
  [M('1'), V('1'), M('2'), V('2')], (d) => {
    if (!(d.m1 > 0 && d.m2 > 0) || d.v1 === undefined) return [];
    const { m1, m2 } = d, v1 = d.v1, v2 = d.v2 ?? 0, p = m1 * v1 + m2 * v2, K = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
    const Vc = p / (m1 + m2), Kp = 0.5 * (m1 + m2) * Vc * Vc;
    const e1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2), e2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
    return [`p = ${num(p)} kg·m/s`, `K = ${num(K)} J`,
      `${t('πλαστική', 'inelastic')}: V = ${num(Vc)} m/s`, `ΔK = ${num(Kp - K)} J`,
      `${t('ελαστική', 'elastic')}: υ₁′ = ${num(e1)} m/s`, `υ₂′ = ${num(e2)} m/s`];
  }, ', has values and moves with ▶ (give m₁, υ₁, m₂, υ₂)');

/** Βλήμα που σφηνώνεται σε ακίνητο ξύλο: κοινή ταχύτητα και απώλεια κινητικής ενέργειας. */
export const bulletDef = (): SimDef => def(t('Τιμές του βλήματος', 'Bullet values'), 'm = 20 g, υ = 400 m/s, M = 2 kg',
  // το M πρώτο: αλλιώς το «M = 2 kg» θα διαβαζόταν ως m
  [q('M', 'M', 'kg', /^M$/), M(), V()], (d) => {
    if (!(d.m > 0 && d.M > 0) || d.v === undefined) return [];
    const Vc = (d.m * d.v) / (d.m + d.M), K = 0.5 * d.m * d.v * d.v, Kp = 0.5 * (d.m + d.M) * Vc * Vc;
    return [`V = ${num(Vc)} m/s`, `K${t('πριν', 'before')} = ${num(K)} J`, `K${t('μετά', 'after')} = ${num(Kp)} J`, `${t('θερμότητα', 'heat')} Q = ${num(K - Kp)} J`];
  }, ', has values (give m, υ, M)');

/** Έκρηξη ακίνητου σώματος σε δύο κομμάτια: η ορμή μένει μηδέν. */
export const explosionDef = (): SimDef => def(t('Τιμές της έκρηξης', 'Explosion values'), 'm1 = 1 kg, υ1 = 6 m/s, m2 = 2 kg',
  [M('1'), V('1'), M('2')], (d) => {
    if (!(d.m1 > 0 && d.m2 > 0) || d.v1 === undefined) return [];
    const v2 = (-d.m1 * d.v1) / d.m2;
    return [`υ₂ = ${num(v2)} m/s`, `p₁ = ${num(d.m1 * d.v1)} kg·m/s`, `p₂ = ${num(d.m2 * v2)} kg·m/s`, `K = ${num(0.5 * d.m1 * d.v1 ** 2 + 0.5 * d.m2 * v2 ** 2)} J`];
  }, ', has values (give m₁, υ₁, m₂)');

const R_GAS = 8.314, ATM = 1.013e5;
const P = (i: string) => q(`p${i}`, `p${'₀₁₂'[+i]}`, 'Pa', new RegExp(`^[pP]${i}$`), { atm: ATM, kPa: 1e3, bar: 1e5 });
const VOL = (i: string) => q(`V${i}`, `V${'₀₁₂'[+i]}`, 'm³', new RegExp(`^V${i}$`), { L: 1e-3, l: 1e-3, 'cm³': 1e-6, 'dm³': 1e-3 });
const TEMP = q('T', 'T', 'K', /^T$/, { '°C': 1, C: 1 });

/** Η θερμοκρασία σε K: ό,τι δόθηκε σε °C (κάτω από 150) θεωρείται βαθμοί Κελσίου, όπως γράφεται στις ασκήσεις. */
const kelvin = (s: string, d: SimData): number | undefined => (d.T === undefined ? undefined : /°C|\bC\b/.test(s) ? d.T + 273 : d.T);

/** Ιδανικό αέριο σε δοχείο με έμβολο (ποιοτικά): pV = nRT και η μέση κινητική ενέργεια των μορίων. */
export function gasDef(): SimDef {
  const base = def(t('Τιμές του αερίου', 'Gas values'), 'n = 1 mol, V = 22,4 L, T = 273 K', [q('n', 'n', 'mol', /^n$/), q('V', 'V', 'm³', /^V$/, { L: 1e-3, l: 1e-3 }), TEMP], (d) => {
    if (!(d.n > 0 && d.V > 0 && d.T > 0)) return [];
    return [`p = ${num((d.n * R_GAS * d.T) / d.V)} Pa`, `p = ${num((d.n * R_GAS * d.T) / d.V / ATM)} atm`, `K̄ = ${num(1.5 * 1.38e-23 * d.T)} J`];
  }, ', has values and moves with ▶ (give n, V, T)');
  return { ...base, parse: (s) => { const d = base.parse(s); const k = kelvin(s, d); return k === undefined ? d : { ...d, T: k }; } };
}

/** Μεταβολή ιδανικού μονατομικού αερίου από A σε B (ευθεία στο p–V): έργο = εμβαδόν, ΔU = 3/2 Δ(pV), Q = ΔU + W. */
export const pvDef = (): SimDef => def(t('Τιμές της μεταβολής', 'Process values'), 'p1 = 1 atm, V1 = 2 L, V2 = 6 L (ισοβαρής) ή p2 = 3 atm',
  [P('1'), VOL('1'), P('2'), VOL('2')], (d) => {
    if (d.p1 === undefined || d.V1 === undefined) return [];
    const p2 = d.p2 ?? d.p1, V2 = d.V2 ?? d.V1;
    const W = ((d.p1 + p2) / 2) * (V2 - d.V1), dU = 1.5 * (p2 * V2 - d.p1 * d.V1);
    const kind = p2 === d.p1 ? t('ισοβαρής', 'isobaric') : V2 === d.V1 ? t('ισόχωρη', 'isochoric') : t('ευθεία στο p–V', 'straight line on p–V');
    return [`→ ${kind}`, `W = ${num(W)} J`, `ΔU = ${num(dU)} J`, `Q = ${num(dU + W)} J`];
  }, ', has values (give p₁, V₁ and p₂ or V₂)');

const R_EARTH = 6.4e6;
/** Πεδίο βαρύτητας της Γης σε ύψος h: ένταση, δυναμικό, ταχύτητα δορυφόρου σε κυκλική τροχιά και περίοδος. */
export const gravityDef = (): SimDef => def(t('Τιμές του πεδίου βαρύτητας', 'Gravity values'), 'h = 3200 km (g₀ = 10, R = 6400 km)',
  [LEN('h', 'h', /^[hH]$/), q('g0', 'g₀', 'm/s²', /^g0$/), LEN('RE', 'R', /^R$/)], (d) => {
    if (d.h === undefined) return [];
    const g0 = d.g0 ?? G, R = d.RE ?? R_EARTH, r = R + d.h, gm = g0 * R * R;
    return [`g = ${num(gm / (r * r))} m/s²`, `V = ${num(-gm / r)} J/kg`, `υ${t('τροχ', 'orb')} = ${num(Math.sqrt(gm / r))} m/s`, `T = ${num((2 * PI * r) / Math.sqrt(gm / r))} s`, `υ${t('διαφ', 'esc')} = ${num(Math.sqrt((2 * gm) / r))} m/s`];
  }, ', has values (give h)');

// ====================================================================================================
// Γ΄ Λυκείου
// ====================================================================================================

/** Πλαστική κρούση με σώμα δεμένο σε οριζόντιο ελατήριο (στη θέση ισορροπίας): νέα περίοδος και πλάτος. */
export const springHitDef = (): SimDef => def(t('Τιμές κρούσης και ταλάντωσης', 'Collision and oscillation values'), 'k = 100 N/m, M = 0,9 kg, m = 0,1 kg, υ = 10 m/s',
  [q('k', 'k', 'N/m', /^[kKΚD]$/), q('M', 'M', 'kg', /^M$/), M(), V()], (d) => {
    if (!(d.k > 0 && d.M > 0 && d.m > 0) || d.v === undefined) return [];
    const Vc = (d.m * d.v) / (d.m + d.M), w = Math.sqrt(d.k / (d.m + d.M));
    return [`V = ${num(Vc)} m/s`, `ω′ = ${piNum(w)} rad/s`, `T′ = ${piNum((2 * PI) / w)} s`, `A′ = ${num(Math.abs(Vc) / w)} m`, `E′ = ${num(0.5 * (d.m + d.M) * Vc * Vc)} J`];
  }, ', has values (give k, M, m, υ)');

/** Το πλάτος της εξαναγκασμένης ταλάντωσης ως προς την ιδιοσυχνότητα (για τη σχεδίαση: 1 στον συντονισμό). */
export const resonanceAmp = (f0: number, fd: number): number => {
  const g = 0.25 * f0;
  return (g * f0) / Math.sqrt((f0 * f0 - fd * fd) ** 2 + (g * fd) ** 2);
};
export const resonanceDef = (): SimDef => def(t('Τιμές του συντονισμού', 'Resonance values'), 'f0 = 2 Hz, fδ = 1,5 Hz',
  [q('f0', 'f₀', 'Hz', /^f0$/), q('fd', 'fδ', 'Hz', /^f(δ|d|D)$/)], (d) => {
    if (!(d.f0 > 0) || d.fd === undefined) return [];
    const r = resonanceAmp(d.f0, d.fd);
    return [Math.abs(d.fd - d.f0) < 1e-9 ? t('→ συντονισμός: μέγιστο πλάτος', '→ resonance: largest amplitude') : t(`→ πλάτος ${num(r * 100)}% του μέγιστου`, `→ amplitude ${num(r * 100)}% of the largest`), `f = fδ = ${num(d.fd)} Hz`];
  }, ', has values (give f₀, fδ)');

/** Αρμονικό κύμα: από A, λ και T (ή f, υ) τα υπόλοιπα και η εξίσωση. */
export const waveDef = (): SimDef => def(t('Τιμές του κύματος', 'Wave values'), 'A = 0,1 m, λ = 2 m, T = 0,5 s',
  [LEN('A', 'A', /^[AΑ]$/), LEN('lam', 'λ', /^λ$/), q('T', 'T', 's', /^T$/), q('f', 'f', 'Hz', /^f$/), V()], (d) => {
    const f = d.f ?? (d.T ? 1 / d.T : d.v && d.lam ? d.v / d.lam : undefined);
    const lam = d.lam ?? (d.v && f ? d.v / f : undefined);
    if (!f || !lam) return [];
    const out: string[] = [];
    if (d.T === undefined) out.push(`T = ${num(1 / f)} s`);
    if (d.f === undefined) out.push(`f = ${num(f)} Hz`);
    if (d.lam === undefined) out.push(`λ = ${num(lam)} m`);
    if (d.v === undefined) out.push(`υ = ${num(lam * f)} m/s`);
    out.push(`ω = ${piNum(2 * PI * f)} rad/s`, `k = ${piNum((2 * PI) / lam)} rad/m`);
    if (d.A) out.push(`y = ${num(d.A)}·${t('ημ', 'sin')}2π(t/${num(1 / f)} − x/${num(lam)})`);
    return out;
  }, ', has values and moves with ▶ (give A, λ, T)');

/** Συμβολή από δύο σύγχρονες πηγές: σε ένα σημείο με αποστάσεις r₁, r₂, ενίσχυση ή απόσβεση. */
export const interferenceDef = (): SimDef => def(t('Τιμές της συμβολής', 'Interference values'), 'λ = 2 cm, r1 = 10 cm, r2 = 6 cm, A = 1 cm',
  [LEN('lam', 'λ', /^λ$/), LEN('r1', 'r₁', /^r1$/), LEN('r2', 'r₂', /^r2$/), LEN('A', 'A', /^[AΑ]$/)], (d) => {
    if (!(d.lam > 0) || d.r1 === undefined || d.r2 === undefined) return [];
    const dr = d.r1 - d.r2, n = dr / d.lam, near = (x: number): boolean => Math.abs(x - Math.round(x)) < 1e-6;
    const kind = near(n) ? t('→ ενισχυτική (μέγιστο πλάτος)', '→ constructive (largest amplitude)') : near(n - 0.5) ? t('→ αποσβεστική (ακίνητο)', '→ destructive (at rest)') : t('→ ούτε μέγιστο ούτε ακίνητο', '→ neither maximum nor at rest');
    const out = [`r₁ − r₂ = ${num(dr)} m`, `(r₁ − r₂)/λ = ${num(n)}`, kind];
    if (d.A !== undefined && (near(n) || near(n - 0.5))) out.push(`A′ = ${num(near(n) ? 2 * d.A : 0)} m`);
    return out;
  }, ', has values and moves with ▶ (give λ, r₁, r₂)');

/** Στάσιμο κύμα σε χορδή με δύο ακλόνητα άκρα: λ = 2L/n, δεσμοί, κοιλίες, και συχνότητα αν δοθεί η ταχύτητα. */
export const standingDef = (): SimDef => def(t('Τιμές του στάσιμου', 'Standing wave values'), 'L = 1,2 m, n = 3, υ = 240 m/s',
  [LEN('L', 'L', /^[Lℓl]$/), q('n', 'n', '', /^[nN]$/), V()], (d) => {
    if (!(d.L > 0 && d.n >= 1)) return [];
    const n = Math.round(d.n), lam = (2 * d.L) / n;
    const out = [`λ = ${num(lam)} m`, `${t('δεσμοί', 'nodes')}: ${n + 1}`, `${t('κοιλίες', 'antinodes')}: ${n}`, `${t('απόσταση δεσμών', 'node spacing')} = ${num(lam / 2)} m`];
    if (d.v !== undefined) out.push(`f = ${num(d.v / lam)} Hz`);
    return out;
  }, ', has values and moves with ▶ (give L, n)');

/** Οριζόντια ράβδος με άρθρωση στο ένα άκρο, βάρος στη μέση και κατακόρυφη δύναμη στο άλλο: ροπές και ισορροπία. */
export const leverDef = (): SimDef => def(t('Τιμές της ράβδου', 'Rod values'), 'm = 4 kg, ℓ = 2 m, F = 20 N',
  [M(), LEN('l', 'ℓ', /^[ℓlL]$/), q('F', 'F', 'N', /^F$/), GQ], (d) => {
    if (!(d.m > 0 && d.l > 0)) return [];
    const w = d.m * (d.g ?? G), need = w / 2;
    const out = [`B = ${num(w)} N`, `τB = ${num((w * d.l) / 2)} N·m`, `${t('για ισορροπία', 'for balance')}: F = ${num(need)} N`];
    if (d.F !== undefined) {
      const s = d.F * d.l - (w * d.l) / 2;
      out.push(`τF = ${num(d.F * d.l)} N·m`, `Στ = ${num(s)} N·m`, Math.abs(s) < 1e-9 ? t('→ ισορροπεί', '→ balanced') : s > 0 ? t('→ στρέφεται προς τα πάνω', '→ turns up') : t('→ στρέφεται προς τα κάτω', '→ turns down'));
    }
    return out;
  }, ', has values (give m, ℓ, F)');

const MU0 = 4 * PI * 1e-7;
/** Ευθύγραμμος ρευματοφόρος αγωγός: B = μ₀I / (2πr). */
export const wireDef = (): SimDef => def(t('Τιμές του αγωγού', 'Wire values'), 'I = 5 A, r = 10 cm',
  [q('I', 'I', 'A', /^I$/, { mA: 1e-3 }), LEN('r', 'r', /^[rd]$/)], (d) => (d.I === undefined || !(d.r > 0) ? [] : [`B = ${num((MU0 * d.I) / (2 * PI * d.r))} T`]), ', has values (give I, r)');
/** Πηνίο (σωληνοειδές): B = μ₀NI / ℓ στο εσωτερικό. */
export const coilDef = (): SimDef => def(t('Τιμές του πηνίου', 'Coil values'), 'N = 500, ℓ = 20 cm, I = 2 A',
  [q('N', 'N', '', /^N$/), LEN('l', 'ℓ', /^[ℓlL]$/), q('I', 'I', 'A', /^I$/, { mA: 1e-3 })], (d) => (d.N === undefined || d.I === undefined || !(d.l > 0) ? [] : [`n = ${num(d.N / d.l)} ${t('σπείρες/m', 'turns/m')}`, `B = ${num((MU0 * d.N * d.I) / d.l)} T`]), ', has values (give N, ℓ, I)');

/** Φορτίο κάθετα σε ομογενές μαγνητικό πεδίο: δύναμη Lorentz, ακτίνα και περίοδος της κυκλικής τροχιάς. */
export const chargeBDef = (): SimDef => def(t('Τιμές του φορτίου', 'Charge values'), 'q = 1,6·10⁻¹⁹ C, m = 9,1·10⁻³¹ kg, υ = 1·10⁶ m/s, B = 0,01 T',
  [q('q', 'q', 'C', /^[qQ]$/, { μC: 1e-6, uC: 1e-6, nC: 1e-9 }), M(), V(), q('B', 'B', 'T', /^B$/, { mT: 1e-3 })], (d) => {
    if (d.q === undefined || !(d.m > 0 && d.v > 0 && d.B > 0)) return [];
    const Q = Math.abs(d.q), R = (d.m * d.v) / (Q * d.B);
    return [`F = ${num(Q * d.v * d.B)} N`, `R = ${num(R)} m`, `T = ${num((2 * PI * d.m) / (Q * d.B))} s`];
  }, ', has values and moves with ▶ (give q, m, υ, B)');

/** Ράβδος που κινείται σε ράγες μέσα σε μαγνητικό πεδίο: ΗΕΔ από επαγωγή, ρεύμα, δύναμη Laplace και ισχύς. */
export const railsDef = (): SimDef => def(t('Τιμές της ράβδου', 'Rod values'), 'B = 0,5 T, ℓ = 1 m, υ = 4 m/s, R = 2 Ω',
  [q('B', 'B', 'T', /^B$/, { mT: 1e-3 }), LEN('l', 'ℓ', /^[ℓlL]$/), V(), q('R', 'R', 'Ω', /^R$/)], (d) => {
    if (d.B === undefined || d.l === undefined || d.v === undefined) return [];
    const E = d.B * d.v * d.l, out = [`E = ${num(E)} V`];
    if (d.R > 0) { const I = E / d.R; out.push(`I = ${num(I)} A`, `F${t('L', 'L')} = ${num(d.B * I * d.l)} N`, `P = ${num(I * I * d.R)} W`); }
    return out;
  }, ', has values (give B, ℓ, υ, R)');

/** Στρεφόμενο πλαίσιο σε ομογενές πεδίο (εναλλακτήρας): μέγιστη και ενεργός τάση, συχνότητα. */
export const generatorDef = (): SimDef => def(t('Τιμές του πλαισίου', 'Coil values'), 'N = 100, B = 0,2 T, S = 0,01 m², ω = 100π rad/s',
  [q('N', 'N', '', /^N$/), q('B', 'B', 'T', /^B$/), q('S', 'S', 'm²', /^[SA]$/, { 'cm²': 1e-4 }), q('w', 'ω', 'rad/s', /^ω$/), q('f', 'f', 'Hz', /^f$/)], (d) => {
    const w = d.w ?? (d.f ? 2 * PI * d.f : undefined);
    if (d.N === undefined || d.B === undefined || d.S === undefined || !w) return [];
    const E0 = d.N * d.B * d.S * w;
    return [`E₀ = ${piNum(E0)} V`, `E${t('εν', 'rms')} = ${num(E0 / Math.SQRT2)} V`, `f = ${piNum(w / (2 * PI))} Hz`, `e = ${num(E0)}·${t('ημ', 'sin')}(${piNum(w)}·t)`];
  }, ', has values and turns with ▶ (give N, B, S, ω)', {
    // «ω = 100π» στο παράθυρο: το π γίνεται αριθμός
    parse: (s) => simKit([q('N', 'N', '', /^N$/), q('B', 'B', 'T', /^B$/), q('S', 'S', 'm²', /^[SA]$/, { 'cm²': 1e-4 }), q('w', 'ω', 'rad/s', /^ω$/), q('f', 'f', 'Hz', /^f$/)], num)
      .parse(s.replace(/(\d+(?:[.,]\d+)?)\s*π/g, (_m, n) => String(parseFloat(n.replace(',', '.')) * PI))),
  });

const H = 6.63e-34, E_CH = 1.6e-19;
/** Φωτοηλεκτρικό φαινόμενο: μέγιστη κινητική ενέργεια, συχνότητα κατωφλίου, τάση αποκοπής. */
export const photoDef = (): SimDef => def(t('Τιμές του φωτοηλεκτρικού', 'Photoelectric values'), 'f = 1,5·10¹⁵ Hz (ή λ = 200 nm), φ = 4 eV',
  [q('f', 'f', 'Hz', /^f$/), q('lam', 'λ', 'm', /^λ$/, { nm: 1e-9 }), q('phi', 'φ', 'eV', /^(φ|W|Wο|W0)$/, { J: 1 }, E_CH)], (d) => {
    const f = d.f ?? (d.lam ? 3e8 / d.lam : undefined);
    if (!f || d.phi === undefined) return [];
    const K = H * f - d.phi, f0 = d.phi / H;
    const out = [`hf = ${num((H * f) / E_CH)} eV`, `f₀ = ${num(f0)} Hz`];
    out.push(K > 0 ? `K${t('max', 'max')} = ${num(K / E_CH)} eV` : t('→ δεν βγαίνουν ηλεκτρόνια (f < f₀)', '→ no electrons (f < f₀)'));
    if (K > 0) out.push(`V${t('αποκ', 'stop')} = ${num(K / E_CH)} V`);
    return out;
  }, ', has values (give f or λ, φ)');
