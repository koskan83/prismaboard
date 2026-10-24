import { describe, expect, it } from 'vitest';
import { MAX_OPTS, OPT_ORDER, OVER_LIMIT, stampOpts } from '../src/stamp-opts';
import { STAMPS } from '../src/stamps';

describe('κουμπιά του επιλεγμένου σχήματος', () => {
  it('ελατήρια και εκκρεμές: στην κανονική έκδοση θέσεις, απόσβεση, στοπ· στη beta και Τιμές (δεύτερο), θέση, 📌, στοίχιση', () => {
    for (const n of ['spring', 'springV', 'springIncline', 'pendulum']) {
      expect(stampOpts(n, false)).toEqual(['marks', 'damp', 'stop']);
      expect(stampOpts(n, true)).toEqual(['sim', 'marks', 'damp', 'stop', 'pos', 'pin', 'copy']);
    }
  });
  it('σχήματα με κίνηση: μόνο ▶· χωρίς επιλογές: τίποτα', () => {
    expect(stampOpts('waveT', true)).toEqual(['play', 'sim']);
    expect(stampOpts('waveT', false)).toEqual(['play']);
    expect(stampOpts('projectile', false)).toEqual(['play']);
    expect(stampOpts('pulley', true)).toEqual([]);
    expect(stampOpts('δεν-υπάρχει', true)).toEqual([]);
    expect(stampOpts('constructor', true)).toEqual([]);
  });
  it('πάντα με τη σταθερή σειρά, και το πολύ 5 δικά του κουμπιά (εκτός από τις γνωστές εξαιρέσεις)', () => {
    for (const n of Object.keys(STAMPS)) {
      for (const beta of [false, true]) {
        const o = stampOpts(n, beta);
        expect(o).toEqual(OPT_ORDER.filter((x) => o.includes(x)));
        if (!OVER_LIMIT.has(n)) expect(o.length, n).toBeLessThanOrEqual(MAX_OPTS);
      }
    }
  });
  it('σχήμα με δική του λίστα και τιμές: η λίστα του, και το «Τιμές» μόνο όπου υπάρχει', () => {
    STAMPS.zzOpts = { ...STAMPS.waveT, opts: ['play', 'marks'], sim: STAMPS.spring.sim };
    try {
      expect(stampOpts('zzOpts', true)).toEqual(['play', 'sim', 'marks']);
      expect(stampOpts('zzOpts', false)).toEqual(['play', 'marks']);
    } finally {
      delete STAMPS.zzOpts;
    }
  });
});
