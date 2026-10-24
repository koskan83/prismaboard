import { describe, expect, it } from 'vitest';
import { stampSim } from '../src/sim-def';
import { stampOpts } from '../src/stamp-opts';
import { STAMPS } from '../src/stamps';

/** Οι απαντήσεις χωρίς τη μορφή της γλώσσας (κόμμα ή τελεία, τελεία χιλιάδων). */
const ans = (n: string, s: string): string => {
  const d = stampSim(n, true)!;
  return d.answers(d.parse(s)).join(' | ').replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
};

describe('δυνάμεις του 10 στα δεδομένα', () => {
  it('«1,6·10⁻¹⁹», «1.6e-19», «2 × 10^6» και ξαναγράφεται όπως διαβάστηκε', () => {
    const d = stampSim('chargeB', true)!;
    expect(d.parse('q = 1,6·10⁻¹⁹ C, m = 9.1e-31 kg, υ = 2 × 10^6 m/s, B = 10 mT')).toEqual({ q: 1.6e-19, m: 9.1e-31, v: 2e6, B: 0.01 });
    const s = { q: 1.6e-19, m: 9.1e-31, v: 1e6, B: 0.01 };
    const back = d.parse(d.text(s));
    for (const k of Object.keys(s) as (keyof typeof s)[]) expect(back[k]).toBeCloseTo(s[k], 40);
  });
});

describe('Β΄ Λυκείου Προσανατολισμού', () => {
  it('οριζόντια βολή από 20 m με 10 m/s', () => {
    expect(ans('projectile', 'υ0 = 10 m/s, h = 20 m')).toBe('t = 2 s | xmax = 20 m | υy = 20 m/s | υ = 22.4 m/s | εφθ = 2');
  });
  it('κυκλική: R = 2 m, T = 4 s, με π όπου βγαίνει, κεντρομόλος και στροφορμή', () => {
    expect(ans('circular', 'R = 2 m, T = 4 s, m = 1 kg')).toMatch(/^f = 0.25 Hz \| ω = π\/2 rad\/s \| υ = π m\/s \| aκ = π²\/2 ≈ 4.93 m\/s² \| Fκ = π²\/2 ≈ 4.93 N \| L = 2π kg·m²\/s$/);
  });
  it('κρούσεις: πλαστική και ελαστική, βλήμα σε ξύλο, έκρηξη', () => {
    expect(ans('collision', 'm1 = 2 kg, υ1 = 3 m/s, m2 = 1 kg, υ2 = -1 m/s')).toBe('p = 5 kg·m/s | K = 9.5 J | πλαστική: V = 1.67 m/s | ΔK = -5.33 J | ελαστική: υ₁′ = 0.333 m/s | υ₂′ = 4.33 m/s');
    expect(ans('bullet', 'm = 20 g, υ = 400 m/s, M = 2 kg')).toBe('V = 3.96 m/s | Kπριν = 1600 J | Kμετά = 15.8 J | θερμότητα Q = 1580 J');
    expect(ans('explosion', 'm1 = 1, υ1 = 6, m2 = 2')).toBe('υ₂ = -3 m/s | p₁ = 6 kg·m/s | p₂ = -6 kg·m/s | K = 27 J');
  });
  it('αέριο: pV = nRT (και °C → K), μεταβολή στο p–V χωρίς ln', () => {
    expect(ans('gasbox', 'n = 1 mol, V = 22,4 L, T = 273 K')).toMatch(/^p = 1.01·10⁵ Pa \| p = 1 atm/);
    expect(stampSim('gasbox', true)!.parse('T = 27 °C').T).toBe(300);
    expect(ans('pv', 'p1 = 1 atm, V1 = 2 L, V2 = 6 L')).toBe('→ ισοβαρής | W = 405 J | ΔU = 608 J | Q = 1010 J');
    expect(ans('pv', 'p1 = 1 atm, V1 = 2 L, p2 = 3 atm')).toMatch(/^→ ισόχωρη \| W = 0 J \| ΔU = 608 J \| Q = 608 J$/);
  });
  it('βαρύτητα σε ύψος ίσο με την ακτίνα της Γης: g/4', () => {
    expect(ans('gravity', 'h = 6400 km')).toMatch(/^g = 2.5 m\/s² \| V = -3.2·10⁷ J\/kg \| υτροχ = 5660 m\/s/);
  });
});

describe('Γ΄ Λυκείου', () => {
  it('κρούση σε σώμα ελατηρίου: νέα περίοδος (με π) και πλάτος', () => {
    expect(ans('springHit', 'k = 100 N/m, M = 0,9 kg, m = 0,1 kg, υ = 10 m/s')).toBe("V = 1 m/s | ω′ = 10 rad/s | T′ = π/5 s | A′ = 0.1 m | E′ = 0.5 J");
  });
  it('κύμα, συμβολή, στάσιμο', () => {
    expect(ans('waveT', 'A = 0,1 m, λ = 2 m, T = 0,5 s')).toMatch(/^f = 2 Hz \| υ = 4 m\/s \| ω = 4π rad\/s \| k = π rad\/m \| y = 0.1·ημ2π\(t\/0.5 − x\/2\)$/);
    expect(ans('interference', 'λ = 2 cm, r1 = 10 cm, r2 = 6 cm, A = 1 cm')).toMatch(/→ ενισχυτική.* \| A′ = 0.02 m$/);
    expect(ans('interference', 'λ = 2 cm, r1 = 10 cm, r2 = 7 cm')).toMatch(/→ αποσβεστική/);
    expect(ans('waveS', 'L = 1,2 m, n = 3, υ = 240 m/s')).toBe('λ = 0.8 m | δεσμοί: 4 | κοιλίες: 3 | απόσταση δεσμών = 0.4 m | f = 300 Hz');
  });
  it('ράβδος: ροπές και ισορροπία', () => {
    expect(ans('lever', 'm = 4 kg, ℓ = 2 m, F = 20 N')).toBe('B = 40 N | τB = 40 N·m | για ισορροπία: F = 20 N | τF = 40 N·m | Στ = 0 N·m | → ισορροπεί');
  });
  it('μαγνητικό πεδίο: αγωγός, πηνίο, φορτίο σε B, ράβδος σε ράγες, εναλλακτήρας', () => {
    expect(ans('wireField', 'I = 5 A, r = 10 cm')).toBe('B = 10⁻⁵ T');
    expect(ans('coilField', 'N = 500, ℓ = 20 cm, I = 2 A')).toBe('n = 2500 σπείρες/m | B = 0.00628 T');
    expect(ans('chargeB', 'q = 1,6·10⁻¹⁹ C, m = 9,1·10⁻³¹ kg, υ = 1·10⁶ m/s, B = 0,01 T')).toBe('F = 1.6·10⁻¹⁵ N | R = 5.69·10⁻⁴ m | T = 3.57·10⁻⁹ s');
    expect(ans('rails', 'B = 0,5 T, ℓ = 1 m, υ = 4 m/s, R = 2 Ω')).toBe('E = 2 V | I = 1 A | FL = 0.5 N | P = 2 W');
    expect(ans('generator', 'N = 100, B = 0,2 T, S = 0,01 m², ω = 100π rad/s')).toMatch(/^E₀ = 20π V \| Eεν = 44.4 V \| f = 50 Hz/);
  });
  it('φωτοηλεκτρικό: Kmax = hf − φ, και κάτω από το κατώφλι δεν βγαίνουν ηλεκτρόνια', () => {
    expect(ans('photo', 'f = 1,5·10¹⁵ Hz, φ = 4 eV')).toMatch(/^hf = 6.22 eV \| f₀ = 9.65·10¹⁴ Hz \| Kmax = 2.22 eV \| Vαποκ = 2.22 V$/);
    expect(ans('photo', 'λ = 600 nm, φ = 4 eV')).toMatch(/δεν βγαίνουν ηλεκτρόνια/);
  });
  it('συντονισμός: μέγιστο πλάτος όταν fδ = f₀', () => {
    expect(ans('resonance', 'f0 = 2 Hz, fδ = 2 Hz')).toMatch(/^→ συντονισμός/);
    expect(ans('resonance', 'f0 = 2 Hz, fδ = 1 Hz')).toMatch(/^→ πλάτος \d/);
  });
});

describe('beta πρώτα, και ζωγραφίζονται', () => {
  const NEW = ['gasbox', 'pv', 'gravity', 'shm', 'resonance', 'chargeB', 'generator', 'photo'];
  it('τα νέα μόνο στη beta· όσα κινούνται έχουν ▶ και «Τιμές»', () => {
    for (const n of NEW) expect(STAMPS[n].beta, n).toBe(true);
    for (const n of ['gasbox', 'shm', 'chargeB', 'generator', 'projectile', 'waveT']) expect(stampOpts(n, true), n).toEqual(['play', 'sim']);
    expect(stampOpts('projectile', false)).toEqual(['play']);
  });
  it('ζωγραφίζονται χωρίς τιμές και με τιμές, ακίνητα και σε κίνηση', () => {
    const c = new Proxy({}, { get: (_o, k) => (k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true }) as unknown as CanvasRenderingContext2D;
    const sim = { T: 400, V: 0.01, p1: 1e5, V1: 1e-3, V2: 3e-3, h: 1e6, m: 1, k: 50, A: 0.2, f0: 2, fd: 1, q: -1e-6, v: 10, B: 1, phi: 3e-19, f: 1e15 };
    for (const n of NEW) {
      expect(() => STAMPS[n].draw(c, STAMPS[n].w, STAMPS[n].h)).not.toThrow();
      expect(() => STAMPS[n].draw(c, STAMPS[n].w, STAMPS[n].h, { d: 0, amp: 0, t: 1700 }, sim)).not.toThrow();
    }
  });
});
