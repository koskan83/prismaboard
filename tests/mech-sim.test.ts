import { describe, expect, it } from 'vitest';
import { stampSim } from '../src/sim-def';
import { stampOpts } from '../src/stamp-opts';
import { STAMPS } from '../src/stamps';

/** Οι απαντήσεις χωρίς τη μορφή της γλώσσας (κόμμα ή τελεία, τελεία χιλιάδων). */
const ans = (n: string, s: string): string => {
  const d = stampSim(n, true)!;
  return d.answers(d.parse(s)).join(' | ').replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
};

describe('κεκλιμένο επίπεδο', () => {
  it('γλιστράει: m = 2 kg, φ = 30°, μ = 0,2', () => {
    expect(ans('incline', 'm = 2 kg, φ = 30°, μ = 0,2')).toBe('B = 20 N | Bx = 10 N | By = 17.3 N | N = 17.3 N | T = 3.46 N | ΣF = 6.54 N | a = 3.27 m/s² | → κατεβαίνει');
  });
  it('με δύναμη προς τα πάνω: ανεβαίνει ή μένει ακίνητο (στατική τριβή)', () => {
    expect(ans('incline', 'm = 2, φ = 30, μ = 0,2, F = 15 N')).toMatch(/T = 3.46 N \| ΣF = 1.54 N \| a = 0.768 m\/s² \| → ανεβαίνει$/);
    expect(ans('incline', 'm = 2, φ = 30, μ = 0,2, F = 12 N')).toMatch(/T = 2 N \| ΣF = 0 N \| a = 0 m\/s² \| → μένει ακίνητο$/);
    // λείο: χωρίς τριβή
    expect(ans('incline', 'm = 2, φ = 30')).toMatch(/N = 17.3 N \| ΣF = 10 N \| a = 5 m\/s² \| → κατεβαίνει$/);
  });
});

describe('σώμα με τριβή, κίνηση, πτώση', () => {
  it('οριζόντια: a = (F − μmg)/m, και μετά από t η ταχύτητα και η μετατόπιση', () => {
    expect(ans('friction', 'm = 4 kg, F = 20 N, μ = 0,25, t = 3 s')).toBe('B = 40 N | N = 40 N | T = 10 N | ΣF = 10 N | a = 2.5 m/s² | υ = 7.5 m/s | Δx = 11.3 m');
    expect(ans('friction', 'm = 4, F = 5, μ = 0,25')).toMatch(/→ μένει ακίνητο$/);
  });
  it('ευθύγραμμη ομαλά επιταχυνόμενη: εξισώσεις και τιμές τη στιγμή t', () => {
    expect(ans('motion1d', 'x0 = 0, υ0 = 2 m/s, a = 1 m/s², t = 4 s')).toBe('x = 0 + 2·t + 0.5·t² | υ = 2 + 1·t | x(4) = 16 m | υ(4) = 6 m/s | Δx = 16 m');
    // χιλιόμετρα την ώρα
    expect(stampSim('motion1d', true)!.parse('υ0 = 72 km/h').v0).toBeCloseTo(20);
  });
  it('ελεύθερη πτώση από 20 m: 2 s, 20 m/s, και η δυναμική γίνεται κινητική', () => {
    expect(ans('freefall', 'h = 20 m, m = 2 kg')).toBe('t = 2 s | υ = 20 m/s | U = 400 J | Kτελ = 400 J');
    const d = stampSim('freefall', true)!;
    expect(d.live!({ h: 20, m: 2 }, { d: 0, amp: 0, t: 1000 })).toMatch(/^t = 1 s · y = 15 m · υ = 10 m\/s · U = 300 J · K = 100 J$/);
  });
});

describe('υγρά, Hooke, δύο δυνάμεις', () => {
  it('πίεση, άνωση, φαινόμενο βάρος, και αν επιπλέει', () => {
    expect(ans('fluid', 'ρυγρ = 1000, h = 2 m, V = 2 L, m = 3 kg')).toBe('p = 20000 Pa | Α = 20 N | B = 30 N | Bφ = 10 N | ρσ = 1500 kg/m³ | → βυθίζεται');
    expect(ans('fluid', 'V = 2 L, m = 1 kg')).toMatch(/→ επιπλέει$/);
  });
  it('Hooke: Δl = F/k και το νέο μήκος', () => {
    expect(ans('hooke', 'k = 50 N/m, m = 0,5 kg, L0 = 20 cm')).toBe('F = 5 N | Δl = 0.1 m | L = 0.3 m');
    expect(ans('hooke', 'k = 200, F = 10 N')).toBe('F = 10 N | Δl = 0.05 m');
  });
  it('συνισταμένη 3 N και 4 N κάθετων: 5 N, και η δύναμη που ισορροπεί', () => {
    expect(ans('forces2', 'F1 = 3 N, F2 = 4 N, θ = 90°')).toMatch(/^R = 5 N \| .* = 53.1° \| .*F₃ = 5 N$/);
    expect(ans('forces2', 'F1 = 3, F2 = 3, θ = 0')).toMatch(/^R = 6 N/);
  });
});

describe('beta πρώτα', () => {
  it('τα νέα σχήματα υπάρχουν μόνο στη beta, με ▶ όπου κινούνται', () => {
    for (const n of ['motion1d', 'freefall', 'fluid', 'hooke', 'forces2']) {
      expect(STAMPS[n].beta).toBe(true);
      expect(stampSim(n, false)).toBeNull();
    }
    expect(stampOpts('motion1d', true)).toEqual(['play', 'sim']);
    expect(stampOpts('hooke', true)).toEqual(['sim']);
    // κεκλιμένο και τριβή υπάρχουν και στην κανονική, χωρίς τιμές εκεί
    expect(stampOpts('incline', false)).toEqual([]);
    expect(stampOpts('incline', true)).toEqual(['sim']);
  });
  it('τα σχήματα ζωγραφίζονται και χωρίς τιμές (στο μενού) και με τιμές', () => {
    const calls: string[] = [];
    const c = new Proxy({}, { get: (_o, k) => (k === 'measureText' ? () => ({ width: 10 }) : () => calls.push(String(k))), set: () => true }) as unknown as CanvasRenderingContext2D;
    for (const n of ['motion1d', 'freefall', 'fluid', 'hooke', 'forces2']) {
      expect(() => STAMPS[n].draw(c, STAMPS[n].w, STAMPS[n].h)).not.toThrow();
      expect(() => STAMPS[n].draw(c, STAMPS[n].w, STAMPS[n].h, { d: 0, amp: 0, t: 1500 }, { h: 5, m: 1, v0: -1, a: 2, k: 10, L0: 0.2, F1: 1, F2: 2, th: 120, V: 1e-3, rho: 1000 })).not.toThrow();
    }
    expect(calls.length).toBeGreaterThan(100);
  });
});
