/** Προσομοίωση απλής αρμονικής ταλάντωσης για τα ελατήρια και το εκκρεμές: από m, k (ή L, g) και A, οι T, f, ω, υmax, amax, E. */

import { locale, t } from './i18n';

export interface OscSim { m?: number; k?: number; A?: number; L?: number; g?: number }

/** Το g όταν δεν δίνεται: όπως στα σχολικά βιβλία. */
export const G_DEFAULT = 10;

/**
 * Διαβάζει «m = 2, k = 200 N/m, A = 0,1» (δεκαδικά με κόμμα ή τελεία), και από κείμενο άσκησης:
 * D αντί για k, ℓ ή l αντί για L, μάζα σε g, μήκη σε cm ή mm (γίνονται kg και m). Ό,τι λείπει μένει κενό.
 */
export function parseSim(s: string): OscSim {
  const out: OscSim = {};
  const key: Record<string, keyof OscSim> = { m: 'm', k: 'k', D: 'k', A: 'A', L: 'L', l: 'L', ℓ: 'L', g: 'g' };
  for (const m of s.matchAll(/(?:^|[^\p{L}_])(m|k|D|A|L|l|ℓ|g)\s*=\s*(\d+(?:[.,]\d+)?)\s*(\p{L}[\p{L}/²]*)?/gu)) {
    const k = key[m[1]];
    let v = parseFloat(m[2].replace(',', '.'));
    const unit = m[3];
    if (unit === 'g' && k === 'm') v /= 1000;
    else if (unit === 'cm' && (k === 'A' || k === 'L')) v /= 100;
    else if (unit === 'mm' && (k === 'A' || k === 'L')) v /= 1000;
    if (v > 0 && out[k] === undefined) out[k] = v;
  }
  return out;
}

/** Η αντίστροφη του parseSim, για να ξαναγράφεται στο πλαίσιο. */
export function simText(s: OscSim | undefined, pendulum: boolean): string {
  if (!s) return '';
  const keys: (keyof OscSim)[] = pendulum ? ['L', 'g', 'm', 'A'] : ['m', 'k', 'A', 'g'];
  return keys.filter((k) => s[k] !== undefined).map((k) => `${k} = ${num(s[k]!)}`).join(', ');
}

/** Κυκλική συχνότητα (rad/s), ή null αν λείπουν δεδομένα. */
export function omega(s: OscSim | undefined, pendulum: boolean): number | null {
  if (!s) return null;
  if (pendulum) return s.L ? Math.sqrt((s.g ?? G_DEFAULT) / s.L) : null;
  return s.k && s.m ? Math.sqrt(s.k / s.m) : null;
}

/** Αριθμός με τρία σημαντικά ψηφία, με το κόμμα της γλώσσας. */
export function num(v: number): string {
  if (!isFinite(v)) return '—';
  const r = Number(v.toPrecision(3));
  return (Object.is(r, -0) ? 0 : r).toLocaleString(locale, { maximumFractionDigits: 6 });
}

/** Οι σταθερές τιμές της ταλάντωσης, μία ανά γραμμή. `vertical`: κατακόρυφο ελατήριο (και η παραμόρφωση Δl στη θέση ισορροπίας). */
export function simLines(s: OscSim | undefined, pendulum: boolean, vertical = false): string[] {
  const w = omega(s, pendulum);
  if (!s || !w) return [];
  const T = (2 * Math.PI) / w;
  const out = [`T = ${num(T)} s`, `f = ${num(1 / T)} Hz`, `ω = ${num(w)} rad/s`];
  if (s.A) {
    out.push(`υmax = ${num(w * s.A)} m/s`, `amax = ${num(w * w * s.A)} m/s²`);
    // ενέργεια: ½DA², με D = k (ελατήριο) ή mω² (εκκρεμές, που θέλει και τη μάζα)
    const D = pendulum ? (s.m ? s.m * w * w : null) : s.k!;
    if (D) out.push(`E = ${num(0.5 * D * s.A * s.A)} J`);
  }
  if (vertical && s.k && s.m) out.push(`Δl = ${num((s.m * (s.g ?? G_DEFAULT)) / s.k)} m`);
  return out;
}

/** Οι τιμές της στιγμής: σε θέση x = A·r (r από −1 έως 1), με φάση ph όσο ταλαντώνεται, αλλιώς ακίνητο σε εκείνη τη θέση. */
export function liveLine(s: OscSim | undefined, pendulum: boolean, r: number, ph?: number, fade = 1): string | null {
  const w = omega(s, pendulum);
  if (!s || !w || !s.A) return null;
  const x = s.A * r;
  // όσο κινείται: υ = −ωA·sin(ωt)· ακίνητο σε θέση: το μέτρο της ταχύτητας που θα είχε εκεί, |υ| = ω√(A² − x²)
  const v = ph === undefined ? null : -w * s.A * fade * Math.sin(ph);
  const speed = v === null ? `|υ| = ${num(w * Math.sqrt(Math.max(0, s.A * s.A - x * x)))} m/s` : `υ = ${num(v)} m/s`;
  return `x = ${num(x)} m · ${speed} · a = ${num(-w * w * x)} m/s²`;
}

/** Περίοδος της κίνησης στον πίνακα (ms): η πραγματική, μέσα σε λογικά όρια ώστε να φαίνεται. */
export function periodMs(s: OscSim | undefined, pendulum: boolean): number | null {
  const w = omega(s, pendulum);
  return w ? Math.min(12000, Math.max(250, (2000 * Math.PI) / w)) : null;
}

export const SIM_HINT = (pendulum: boolean): string => pendulum
  ? t('Π.χ. L = 1, g = 10, A = 0,05 (μέτρα· η μάζα m για την ενέργεια). Κενό: χωρίς τιμές.', 'E.g. L = 1, g = 10, A = 0.05 (metres; mass m for the energy). Empty: no values.')
  : t('Π.χ. m = 2, k = 200, A = 0,1 (kg, N/m, m· g = 10 αν δεν δοθεί). Κενό: χωρίς τιμές.', 'E.g. m = 2, k = 200, A = 0.1 (kg, N/m, m; g = 10 if not given). Empty: no values.');
