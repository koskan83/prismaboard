import { describe, expect, it } from 'vitest';
import { stampSim } from '../src/sim-def';
import { stampOpts } from '../src/stamp-opts';
import '../src/stamps';

const def = (n: string) => stampSim(n, true)!;
/** Οι απαντήσεις χωρίς τη μορφή της γλώσσας (κόμμα ή τελεία, κενά χιλιάδων). */
const ans = (n: string, s: string) => def(n).answers(def(n).parse(s)).join(' | ').replace(/(\d),(\d)/g, '$1.$2');

describe('κυκλώματα με τιμές', () => {
  it('σε σειρά: R = R₁ + R₂, ίδιο ρεύμα, τάσεις ανάλογες', () => {
    const a = ans('circSeries2', 'E = 12 V, R1 = 4 Ω, R2 = 8 Ω');
    expect(a).toMatch(/^Rολ = 12 Ω \| I = 1 A \| P = 12 W \| I₁ = 1 A, V₁ = 4 V \| I₂ = 1 A, V₂ = 8 V$/);
  });
  it('παράλληλα: 1/R = 1/R₁ + 1/R₂, ίδια τάση, ρεύματα αντιστρόφως ανάλογα', () => {
    expect(ans('circPar2', 'V = 12 V, R₁ = 4 Ω, R₂ = 12 Ω')).toBe('Rολ = 3 Ω | I = 4 A | P = 48 W | I₁ = 3 A, V₁ = 12 V | I₂ = 1 A, V₂ = 12 V');
  });
  it('με εσωτερική αντίσταση: πολική τάση και ρεύμα βραχυκύκλωσης', () => {
    expect(ans('circSeries2', 'E = 12 V, r = 2 Ω, R1 = 4 Ω, R2 = 6 Ω')).toMatch(/^Rολ = 10 Ω \| I = 1 A \| Vπολ = 10 V \| Iβρ = 6 A \| P = 10 W/);
  });
  it('μικτές συνδεσμολογίες με 3 αντιστάτες', () => {
    expect(ans('circSeriesPar3', 'E=12V, R1=2, R2=4, R3=6')).toBe('Rολ = 3 Ω | I = 4 A | P = 48 W | I₁ = 2 A, V₁ = 4 V | I₂ = 2 A, V₂ = 8 V | I₃ = 2 A, V₃ = 12 V');
    expect(ans('circParSeries3', 'E=12V, R1=6, R2=3, R3=4')).toBe('Rολ = 6 Ω | I = 2 A | P = 24 W | I₁ = 0.667 A, V₁ = 4 V | I₂ = 1.33 A, V₂ = 4 V | I₃ = 2 A, V₃ = 8 V');
    expect(ans('circSeries3', 'E=12V, R1=1, R2=2, R3=3')).toMatch(/^Rολ = 6 Ω \| I = 2 A/);
    expect(ans('circPar3', 'E=12V, R1=6, R2=6, R3=6')).toMatch(/^Rολ = 2 Ω \| I = 6 A/);
  });
  it('με αμπερόμετρο και βολτόμετρο: ένας αντιστάτης', () => {
    expect(ans('circMeters', 'E = 6 V, R1 = 3 Ω')).toBe('Rολ = 3 Ω | I = 2 A | P = 12 W | V = 6 V');
  });
  it('διαβάζει δείκτες και μονάδες, και ξαναγράφει ό,τι διάβασε', () => {
    const d = def('circSeries2');
    expect(d.parse('E = 12 V, R₁ = 2 kΩ, R_2 = 4Ω, R2 = 9')).toEqual({ E: 12, R1: 2000, R2: 4 });
    const s = { E: 9, r: 0.5, R1: 10, R2: 20 };
    expect(d.parse(d.text(s))).toEqual(s);
    expect(d.dataLine(s)).toMatch(/^E = 9 V · r = 0[.,]5 Ω · R₁ = 10 Ω · R₂ = 20 Ω$/);
    // χωρίς όλες τις αντιστάσεις ή χωρίς πηγή: καμία απάντηση
    expect(d.answers({ E: 12, R1: 4 })).toEqual([]);
    expect(d.answers({ R1: 4, R2: 4 })).toEqual([]);
  });
});

describe('δύο φορτία με τιμές', () => {
  it('Coulomb, ένταση και δυναμικό στο μέσο, δυναμική ενέργεια· τα πρόσημα από το σχήμα', () => {
    expect(ans('dipole', 'q1 = 2 μC, q2 = 3 μC, r = 30 cm')).toMatch(/^F = 0.6 N \(έλξη\) \| EΜ = 2·10⁶ N\/C \| VΜ = [-−]60[ .]?000 V \| U = [-−]0.18 J$/);
    expect(ans('likeCharges', 'q₁ = 2 μC, q₂ = 2 μC, r = 0,2 m')).toMatch(/^F = 0.9 N \(άπωση\) \| EΜ = 0 N\/C \| VΜ = 3.6·10⁵ V \| U = 0.18 J$/);
    // το μέτρο αρκεί: ένα «−» στο q₂ δεν αλλάζει αυτό που δείχνει το σχήμα
    expect(ans('dipole', 'q1 = 2 μC, q2 = -3 μC, r = 30 cm')).toBe(ans('dipole', 'q1 = 2 μC, q2 = 3 μC, r = 30 cm'));
    expect(def('dipole').parse('q1 = 5 nC, q2 = 2 C, d = 1 m')).toEqual({ q1: 5e-9, q2: 2, r: 1 });
  });
});

describe('beta πρώτα', () => {
  it('οι τιμές του ηλεκτρισμού φαίνονται μόνο στη beta, με το κουμπί «Τιμές»', () => {
    for (const n of ['circSeries2', 'circPar3', 'dipole', 'likeCharges']) {
      expect(stampSim(n, false)).toBeNull();
      expect(stampOpts(n, true)).toEqual(['sim']);
      expect(stampOpts(n, false)).toEqual([]);
    }
    // πολλές πηγές (Kirchhoff) και λάμπες: χωρίς τιμές (εκτός ύλης ή μόνο ποιοτικά)
    expect(stampSim('circKirchhoff', true)).toBeNull();
    expect(stampSim('circLamp', true)).toBeNull();
  });
});
