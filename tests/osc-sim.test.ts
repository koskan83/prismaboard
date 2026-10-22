import { describe, expect, it } from 'vitest';
import { liveLine, omega, parseSim, periodMs, simLines, simText } from '../src/osc-sim';

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
    // το Δl δεν είναι μήκος νήματος, ούτε το m_A μάζα
    expect(parseSim('Δl = 0,1 m, m_A = 3')).toEqual({});
  });
  it('ξαναγράφει τις τιμές στη μορφή που διαβάζει', () => {
    const s = { m: 2, k: 200, A: 0.1 };
    expect(parseSim(simText(s, false))).toEqual(s);
  });
  it('ελατήριο: ω = √(k/m), T = 2π/ω, υmax = ωA, E = ½kA²', () => {
    expect(omega({ m: 2, k: 200 }, false)).toBeCloseTo(10);
    const lines = simLines({ m: 2, k: 200, A: 0.1 }, false, true).join(' | ');
    expect(lines).toContain('ω = 10 rad/s');
    expect(lines).toMatch(/T = 0[.,]628 s/);
    expect(lines).toContain('υmax = 1 m/s');
    expect(lines).toContain('amax = 10 m/s²');
    expect(lines).toContain('E = 1 J');
    expect(lines).toMatch(/Δl = 0[.,]1 m/);
  });
  it('εκκρεμές: ω = √(g/L), με g = 10 αν λείπει', () => {
    expect(omega({ L: 2.5 }, true)).toBeCloseTo(2);
    expect(omega({ L: 2.5, g: 10 }, false)).toBeNull();
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
