import { describe, expect, it } from 'vitest';
import { dataLine, liveLine, omega, parseSim, periodMs, piNum, simLines, simText, solve } from '../src/osc-sim';

describe('προσομοίωση ταλάντωσης', () => {
  it('διαβάζει τιμές με κόμμα ή τελεία και αγνοεί μονάδες', () => {
    expect(parseSim('m = 2, k=200 N/m, A=0,1')).toEqual({ m: 2, k: 200, A: 0.1 });
    expect(parseSim('L=1.5,g=9.8')).toEqual({ L: 1.5, g: 9.8 });
    expect(parseSim('')).toEqual({});
  });
  it('διαβάζει κείμενο άσκησης: D, ℓ, γραμμάρια και εκατοστά', () => {
    expect(parseSim('Σώμα μάζας m = 200 g δένεται σε ελατήριο σταθεράς D = 80 N/m με πλάτος A = 5 cm.')).toEqual({ m: 0.2, k: 80, A: 0.05 });
    expect(parseSim('ℓ = 40 cm, g = 10 m/s²')).toEqual({ L: 0.4, g: 10 });
    expect(parseSim('k=200N/m, A=0,1m, m=2kg')).toEqual({ k: 200, A: 0.1, m: 2 });
    // το m_A δεν είναι η μάζα της ταλάντωσης, ούτε το x ή το υ μιας στιγμής κάποιο από τα δεδομένα
    expect(parseSim('m_A = 3, x = 0,1, υ = 2')).toEqual({});
  });
  it('διαβάζει και T, f, ω, ενέργεια, υmax, amax, δυνάμεις και Δl, όπως γράφονται', () => {
    expect(parseSim('M = 2 Kg\nK = 100 N/m\nEτ = 20 J')).toEqual({ m: 2, k: 100, E: 20 });
    // έτσι το έγραψε η αναγνώριση στο πραγματικό χειρόγραφο
    expect(parseSim('m = 2 kg\nk = 100 N/m\nE_t = 20 J')).toEqual({ m: 2, k: 100, E: 20 });
    expect(parseSim('T = 500 ms, f = 2 Hz, ω = 4 rad/s')).toEqual({ T: 0.5, f: 2, w: 4 });
    expect(parseSim('E_{ολ} = 1, Εολ = 9, υmax = 2, α_max = 8, ΣFmax = 6, Fελ,max = 30, Δl = 10 cm')).toEqual({ E: 1, v: 2, a: 8, F: 6, Fel: 30, dl: 0.1 });
  });
  it('ξαναγράφει τις τιμές στη μορφή που διαβάζει', () => {
    const s = { m: 2, k: 200, A: 0.1, w: 3, E: 1, v: 2, a: 8, F: 6, Fel: 30, dl: 0.1, T: 1, f: 2 };
    expect(parseSim(simText(s))).toEqual(s);
  });
  it('γράφει τα δεδομένα με τις μονάδες τους', () => {
    expect(dataLine({ m: 2, k: 100, E: 20 })).toBe('m = 2 kg · k = 100 N/m · E = 20 J');
    expect(dataLine(undefined)).toBe('');
  });
  it('ελατήριο: ω = √(k/m), T = 2π/ω, υmax = ωA, E = ½kA²', () => {
    expect(omega({ m: 2, k: 200 }, false)).toBeCloseTo(10);
    const lines = simLines({ m: 2, k: 200, A: 0.1 }, false, true).join(' | ');
    expect(lines).toContain('ω = 10 rad/s');
    expect(lines).toContain('T = π/5 s');
    expect(lines).toContain('υmax = 1 m/s');
    expect(lines).toContain('amax = 10 m/s²');
    expect(lines).toContain('E = 1 J');
    expect(lines).toMatch(/Δl = 0[.,]1 m/);
    // ό,τι δόθηκε δεν ξαναγράφεται
    expect(lines).not.toContain('k =');
  });
  it('το A βγαίνει από την ενέργεια: m = 2, k = 100, Eτ = 20 → A = √(2E/k)', () => {
    const r = solve({ m: 2, k: 100, E: 20 }, false);
    expect(r.A).toBeCloseTo(Math.sqrt(0.4));
    expect(simLines({ m: 2, k: 100, E: 20 }, false).join(' | ')).toMatch(/A = 0[.,]632 m/);
  });
  it('k και m από f, υmax, amax ή Fmax', () => {
    // f = 1/π Hz → ω = 2· με m = 0,5: k = mω² = 2
    expect(solve({ m: 0.5, f: 1 / Math.PI }, false).k).toBeCloseTo(2);
    // υmax και amax: ω = amax/υmax = 4, A = υmax/ω = 0,5
    const r = solve({ v: 2, a: 8 }, false);
    expect(r.w).toBeCloseTo(4);
    expect(r.A).toBeCloseTo(0.5);
    // Fmax = kA και A δίνουν k
    expect(solve({ F: 20, A: 0.1, m: 2 }, false).k).toBeCloseTo(200);
  });
  it('κατακόρυφο: Δl δίνει ω = √(g/Δl), και Fελ,max = mg + kA δίνει A', () => {
    expect(solve({ dl: 0.1 }, false, true).w).toBeCloseTo(10);
    expect(solve({ m: 2, k: 200, Fel: 40 }, false, true).A).toBeCloseTo(0.1);
    // οριζόντια το ίδιο Fελ,max είναι όλο kA
    expect(solve({ m: 2, k: 200, Fel: 40 }, false, false).A).toBeCloseTo(0.2);
  });
  it('εκκρεμές: ω = √(g/L), με g = 10 αν λείπει· και L από την περίοδο', () => {
    expect(omega({ L: 2.5 }, true)).toBeCloseTo(2);
    expect(omega({ L: 2.5, g: 10 }, false)).toBeNull();
    expect(solve({ T: Math.PI }, true).L).toBeCloseTo(2.5);
  });
  it('ό,τι βγαίνει με π κρατά το π: 2π, π/2, 1/(2π), 4π², με «≈» όταν δεν είναι απλό', () => {
    expect(piNum(2 * Math.PI)).toBe('2π');
    expect(piNum(Math.PI)).toBe('π');
    expect(piNum(Math.PI / 2)).toBe('π/2');
    expect(piNum(3 * Math.PI / 4)).toBe('3π/4');
    expect(piNum(4 * Math.PI)).toBe('4π');
    expect(piNum(Math.PI / 10)).toBe('π/10');
    expect(piNum(1 / (2 * Math.PI))).toMatch(/^1\/\(2π\) ≈ 0[.,]159$/);
    expect(piNum(1 / Math.PI)).toMatch(/^1\/π ≈ 0[.,]318$/);
    expect(piNum(4 * Math.PI ** 2)).toMatch(/^4π² ≈ 39[.,]5$/);
    expect(piNum(0.3 * Math.PI)).toMatch(/^0[.,]3π ≈ 0[.,]942$/);
    // ό,τι δεν έχει π μένει όπως ήταν
    expect(piNum(10)).toBe('10');
    expect(piNum(Math.sqrt(2))).toMatch(/^1[.,]41$/);
    expect(piNum(0)).toBe('0');
  });
  it('οι απαντήσεις της άσκησης με π: m = 1, T = 2 s, A = 0,1 m', () => {
    const lines = simLines({ m: 1, T: 2, A: 0.1 }, false).join(' | ');
    expect(lines).toContain('ω = π rad/s');
    expect(lines).toMatch(/k = π² ≈ 9[.,]87 N\/m/);
    expect(lines).toContain('υmax = π/10 m/s');
    expect(lines).toMatch(/amax = π²\/10 ≈ 0[.,]987 m\/s²/);
    // T = 1 s: ω = 2π, f = 1 Hz χωρίς π
    const l2 = simLines({ L: 0.25, T: 1 }, true).join(' | ');
    expect(l2).toContain('ω = 2π rad/s');
    expect(l2).toContain('f = 1 Hz');
    // ελατήριο με ω = 1 rad/s: T = 2π s, f = 1/(2π) Hz
    const l3 = simLines({ m: 1, k: 1 }, false).join(' | ');
    expect(l3).toContain('T = 2π s');
    expect(l3).toMatch(/f = 1\/\(2π\) ≈ 0[.,]159 Hz/);
  });
  it('χωρίς αρκετά δεδομένα δεν βγαίνουν τιμές', () => {
    expect(simLines({ m: 2 }, false)).toEqual([]);
    expect(periodMs(undefined, false)).toBeNull();
  });
  it('στην ακραία θέση η ταχύτητα είναι 0 και η επιτάχυνση μέγιστη', () => {
    const l = liveLine({ m: 2, k: 200, A: 0.1 }, false, 1)!;
    expect(l).toMatch(/x = 0[.,]1 m/);
    expect(l).toContain('|υ| = 0 m/s');
    expect(l).toMatch(/a = [-−]10 m\/s²/);
  });
});
