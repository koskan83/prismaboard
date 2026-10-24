/**
 * Σχήματα με τιμές: ό,τι χρειάζεται ένα σχήμα (ελατήριο, κεκλιμένο, κύκλωμα…) για να δέχεται δεδομένα από τον δάσκαλο
 * και να γράφει τις απαντήσεις στο πλαίσιο κάτω του. Κάθε σχήμα δηλώνει τον δικό του ορισμό στο STAMPS (StampDef.sim)·
 * το πλαίσιο, το παράθυρο «Τιμές», το λάσο και το AI δουλεύουν το ίδιο για όλα.
 */

import { BETA } from './beta';
import { STAMPS, type SpringState } from './stamps';

/** Τα δεδομένα ενός σχήματος, όπως αποθηκεύονται στο StampItem.sim: όνομα μεγέθους → τιμή (SI). */
export type SimData = Record<string, number>;

export interface SimDef {
  /** Ο τίτλος του παραθύρου «Τιμές». */
  title: string;
  /** Το παράδειγμα κάτω από το πεδίο του παραθύρου. */
  hint(): string;
  /** Τα δεδομένα από κείμενο εκφώνησης ή από το παράθυρο («m = 2 kg, φ = 30°…»)· ό,τι λείπει μένει κενό. */
  parse(s: string): SimData;
  /** Η αντίστροφη του parse, για να ξαναγράφεται στο παράθυρο. */
  text(d: SimData): string;
  /** Τα δεδομένα με τις μονάδες τους, σε μία γραμμή· κενό αν δεν υπάρχουν. */
  dataLine(d: SimData): string;
  /** Οι απαντήσεις που βγαίνουν από τα δεδομένα, μία ανά στοιχείο (στο πλαίσιο μπαίνουν ανά τρεις σε κάθε σειρά). */
  answers(d: SimData): string[];
  /** Οι τιμές της στιγμής, όσο το σχήμα κινείται ή κρατιέται σε θέση· null αν δεν υπάρχουν. */
  live?(d: SimData, st: SpringState): string | null;
  /** Η περίοδος της κίνησης στον πίνακα (ms), από τα δεδομένα. */
  periodMs?(d: SimData): number | null;
  /** Πόσο κάτω από το σχήμα αρχίζει το πλαίσιο, σε ύψη γραμμάτων (αν λείπει, 1,4). */
  gap?: number;
  /** Τι λέει ο κατάλογος του AI για το σχήμα (π.χ. «, oscillates (give its data)»). */
  aiNote?: string;
  /** Οι τιμές υπάρχουν μόνο στη δοκιμαστική έκδοση (το ίδιο το σχήμα μπορεί να υπάρχει και στην κανονική). */
  beta?: boolean;
}

/** Ο ορισμός των τιμών ενός σχήματος, ή null αν δεν έχει (ή αν είναι μόνο της beta και τρέχει η κανονική έκδοση). */
export function stampSim(name: string, beta = BETA): SimDef | null {
  const d = Object.prototype.hasOwnProperty.call(STAMPS, name) ? STAMPS[name] : undefined;
  const s = d?.sim;
  if (!d || !s || (d.beta && !beta) || (s.beta && !beta)) return null;
  return s;
}

/** Ένα μέγεθος που δέχεται ένα σχήμα: κλειδί στο SimData (SI), πώς γράφεται, η μονάδα και πώς αναγνωρίζεται το όνομά του. */
export interface SimQty {
  key: string;
  /** Όπως γράφεται στο πλαίσιο και στο παράθυρο (π.χ. «R₁»). */
  name: string;
  /** Η μονάδα όπως φαίνεται· `scale`: πόσες μονάδες SI είναι μία από αυτές (π.χ. μC → 1e-6). */
  unit: string;
  scale?: number;
  /** Το όνομα όπως το γράφει ο δάσκαλος, χωρίς δείκτες: «R1», «R_1», «R₁» → «R1». */
  is: RegExp;
  /** Άλλες μονάδες που δέχεται, σε SI (π.χ. { kΩ: 1e3, nC: 1e-9 }). */
  conv?: Record<string, number>;
}

const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** parse, text και dataLine από τον πίνακα των μεγεθών: ό,τι κοινό έχουν τα σχήματα με τιμές (εκτός από την ταλάντωση, που έχει δικά της). */
export function simKit(qty: SimQty[], num: (v: number) => string): Pick<SimDef, 'parse' | 'text' | 'dataLine'> {
  const show = (q: SimQty, v: number): string => num(v / (q.scale ?? 1));
  const list = (d: SimData): SimQty[] => qty.filter((q) => d[q.key] !== undefined);
  return {
    parse(s) {
      const out: SimData = {};
      // αριθμοί και με δύναμη του 10: «1,6·10⁻¹⁹», «1.6e-19», «2 × 10^6», «10⁶» (όπως τα γράφει το πλαίσιο)
      const re = /(?:^|[^\p{L}\p{N}_])(\p{L}[\p{L}\p{N}_{}]*)\s*=\s*([-−]?\d+(?:[.,]\d+)?)(?:[eE]([-+−]?\d+)|\s*[·×x*]\s*10\s*\^?\s*([-−⁻]?[\d⁰¹²³⁴⁵⁶⁷⁸⁹]+)|([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+))?\s*([\p{L}°/²³]+)?/gu;
      for (const m of s.matchAll(re)) {
        const name = [...m[1].replace(/[_{}]/g, '')].map((c) => (SUB.includes(c) ? String(SUB.indexOf(c)) : c)).join('');
        const q = qty.find((x) => x.is.test(name));
        if (!q || out[q.key] !== undefined) continue;
        const unit = m[6] ?? '';
        const f = unit === q.unit ? q.scale ?? 1 : q.conv?.[unit] ?? 1;
        const sup = (x: string): string => [...x].map((c) => { const i = SUP.indexOf(c); return i >= 0 ? String(i) : c === '⁻' || c === '−' ? '-' : c; }).join('');
        // «10⁶»: το 10 υψωμένο στη δύναμη
        if (m[5]) {
          const b = parseFloat(m[2].replace('−', '-').replace(',', '.'));
          out[q.key] = Math.sign(b) * Math.abs(b) ** Number(sup(m[5])) * f;
          continue;
        }
        const e = m[3] ?? (m[4] ? sup(m[4]) : '0');
        // «1.6e-19» ακριβώς, χωρίς το σφάλμα του 1,6 × 10⁻¹⁹ σε δύο βήματα
        out[q.key] = Number(`${m[2].replace('−', '-').replace(',', '.')}e${e.replace('−', '-')}`) * f;
      }
      return out;
    },
    text: (d) => list(d).map((q) => `${q.name} = ${show(q, d[q.key])}`).join(', '),
    dataLine: (d) => list(d).map((q) => `${q.name} = ${show(q, d[q.key])}${q.unit === '°' ? '°' : q.unit ? ` ${q.unit}` : ''}`).join(' · '),
  };
}
