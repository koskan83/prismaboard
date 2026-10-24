/**
 * Τιμές στα σχήματα του ηλεκτρισμού (βλ. sim-def.ts): κυκλώματα με μία πηγή και ως 3 αντιστάτες (Γ΄ Γυμνασίου, Β΄ Λυκείου),
 * και δύο σημειακά φορτία (Coulomb, πεδίο και δυναμικό στο μέσο). Όπως στο σχολικό βιβλίο, χωρίς Kirchhoff με πολλές πηγές.
 */

import { t } from './i18n';
import { num } from './osc-sim';
import { simKit, type SimData, type SimDef, type SimQty } from './sim-def';

const R = (i: number): SimQty => ({ key: `R${i}`, name: `R${'₀₁₂₃'[i]}`, unit: 'Ω', is: new RegExp(`^[RΡ]${i}$`), conv: { kΩ: 1e3, MΩ: 1e6 } });
const SOURCE: SimQty[] = [
  { key: 'E', name: 'E', unit: 'V', is: /^(E|Ε|ε|V|ΗΕΔ)$/, conv: { mV: 1e-3, kV: 1e3 } },
  { key: 'r', name: 'r', unit: 'Ω', is: /^r$/, conv: { kΩ: 1e3 } },
];

/** Πώς είναι συνδεδεμένοι οι αντιστάτες: '1' ένας (με όργανα), 's' σε σειρά, 'p' παράλληλα, 'sp' (R₁ + R₂) ∥ R₃, 'ps' (R₁ ∥ R₂) + R₃. */
export type Topo = '1' | 's2' | 'p2' | 's3' | 'p3' | 'sp' | 'ps';

const par = (...r: number[]): number => 1 / r.reduce((s, x) => s + 1 / x, 0);

/** Ρεύμα και τάση κάθε αντιστάτη, για ολικό ρεύμα I. */
function split(topo: Topo, R: number[], I: number): { I: number; V: number }[] {
  const at = (i: number) => (v: number) => ({ I: v / R[i], V: v });
  switch (topo) {
    case '1': case 's2': case 's3':
      return R.map((r) => ({ I, V: I * r }));
    case 'p2': case 'p3':
      return R.map((_, i) => at(i)(I * par(...R)));
    case 'sp': {
      const V = I * par(R[0] + R[1], R[2]), I12 = V / (R[0] + R[1]);
      return [{ I: I12, V: I12 * R[0] }, { I: I12, V: I12 * R[1] }, at(2)(V)];
    }
    case 'ps': {
      const V12 = I * par(R[0], R[1]);
      return [at(0)(V12), at(1)(V12), { I, V: I * R[2] }];
    }
  }
}

/** Η ισοδύναμη αντίσταση της συνδεσμολογίας. */
export function rEq(topo: Topo, R: number[]): number {
  if (topo === 'p2' || topo === 'p3') return par(...R);
  if (topo === 'sp') return par(R[0] + R[1], R[2]);
  if (topo === 'ps') return par(R[0], R[1]) + R[2];
  return R.reduce((s, x) => s + x, 0);
}

/** Κύκλωμα με πηγή E (και εσωτερική αντίσταση r, αν δοθεί) και αντιστάτες R₁…: ισοδύναμη, ρεύματα, τάσεις, ισχύς. */
export function circDef(topo: Topo): SimDef {
  const n = topo === '1' ? 1 : topo.endsWith('2') ? 2 : 3;
  const qty = [...SOURCE, ...Array.from({ length: n }, (_, i) => R(i + 1))];
  const ex = `E = 12 V, r = 1 Ω, ${[4, 6, 12].slice(0, n).map((v, i) => `R${'₁₂₃'[i]} = ${v} Ω`).join(', ')}`;
  return {
    title: t('Τιμές του κυκλώματος', 'Circuit values'),
    hint: () => t(`Π.χ. ${ex} (το r αν υπάρχει). Κενό: χωρίς τιμές.`, `E.g. ${ex} (r if given). Empty: no values.`),
    ...simKit(qty, num),
    answers(d: SimData) {
      const Rs = qty.slice(2).map((q) => d[q.key]);
      if (d.E === undefined || Rs.some((r) => !(r > 0))) return [];
      const r = d.r ?? 0, Req = rEq(topo, Rs), I = d.E / (Req + r);
      const out = [`R${t('ολ', 'eq')} = ${num(Req)} Ω`, `I = ${num(I)} A`];
      // με εσωτερική αντίσταση: πολική τάση και ρεύμα βραχυκύκλωσης (V = E − I·r)
      if (r > 0) out.push(`V${t('πολ', 'term')} = ${num(d.E - I * r)} V`, `I${t('βρ', 'sc')} = ${num(d.E / r)} A`);
      out.push(`P = ${num(I * I * Req)} W`);
      // ρεύμα και τάση κάθε αντιστάτη μαζί, για να μη σπάνε σε δύο σειρές του πλαισίου
      if (n > 1) split(topo, Rs, I).forEach((x, i) => out.push(`I${'₁₂₃'[i]} = ${num(x.I)} A, V${'₁₂₃'[i]} = ${num(x.V)} V`));
      else out.push(`V = ${num(I * Rs[0])} V`);
      return out;
    },
    aiNote: ', has values (give E, r, R₁…)',
    beta: true,
  };
}

const K = 9e9;
const CHARGE = (i: number): SimQty => ({ key: `q${i}`, name: `q${'₀₁₂'[i]}`, unit: 'μC', scale: 1e-6, is: new RegExp(`^[qQ]${i}$`), conv: { C: 1, mC: 1e-3, uC: 1e-6, nC: 1e-9, pC: 1e-12 } });

/**
 * Δύο σημειακά φορτία σε απόσταση r: δύναμη Coulomb, και στο μέσο Μ ένταση και δυναμικό, δυναμική ενέργεια του συστήματος.
 * Τα πρόσημα τα ορίζει το σχήμα (`opposite`: + και −), ώστε οι απαντήσεις να συμφωνούν με αυτό που βλέπουν οι μαθητές.
 */
export function chargesDef(opposite: boolean): SimDef {
  const qty = [CHARGE(1), CHARGE(2), { key: 'r', name: 'r', unit: 'm', is: /^[rd]$/, conv: { cm: 1e-2, mm: 1e-3 } }];
  return {
    title: t('Τιμές των φορτίων', 'Charge values'),
    hint: () => t('Π.χ. q₁ = 2 μC, q₂ = 3 μC, r = 30 cm (μέτρα των φορτίων· το πρόσημο το δείχνει το σχήμα). Κενό: χωρίς τιμές.', 'E.g. q₁ = 2 μC, q₂ = 3 μC, r = 30 cm (magnitudes; the drawing shows the sign). Empty: no values.'),
    ...simKit(qty, num),
    answers(d: SimData) {
      if (d.q1 === undefined || d.q2 === undefined || !(d.r > 0)) return [];
      const q1 = Math.abs(d.q1), q2 = (opposite ? -1 : 1) * Math.abs(d.q2), a = d.r / 2;
      return [
        `F = ${num((K * Math.abs(q1 * q2)) / (d.r * d.r))} N (${opposite ? t('έλξη', 'attraction') : t('άπωση', 'repulsion')})`,
        `E${t('Μ', 'M')} = ${num(Math.abs((K * (q1 - q2)) / (a * a)))} N/C`,
        `V${t('Μ', 'M')} = ${num((K * (q1 + q2)) / a)} V`,
        `U = ${num((K * q1 * q2) / d.r)} J`,
      ];
    },
    aiNote: ', has values (give q₁, q₂, r)',
    beta: true,
  };
}
