import { describe, expect, it } from 'vitest';
import { dataLine, liveLine, parseSim, periodMs, simLines, simText, SIM_HINT } from '../src/osc-sim';
import { stampSim } from '../src/sim-def';
import { STAMPS } from '../src/stamps';
import { moveSim, simRows } from '../src/board-sim';
import type { StampItem } from '../src/model';

describe('σχήματα με τιμές: οι ταλαντώσεις ως ορισμός σχήματος', () => {
  const cases: [string, boolean, boolean][] = [['spring', false, false], ['springIncline', false, false], ['springV', false, true], ['pendulum', true, false]];
  const data = [{ m: 2, k: 200, A: 0.1 }, { m: 1, T: 2, A: 0.1 }, { L: 0.25, T: 1 }, { m: 1, dl: 0.1, A: 0.05 }, { m: 2, k: 100, E: 20 }];
  it('δίνουν ακριβώς ό,τι οι συναρτήσεις της ταλάντωσης', () => {
    for (const [name, pend, vert] of cases) {
      const d = stampSim(name)!;
      expect(d, name).toBeTruthy();
      expect(d.hint()).toBe(SIM_HINT(pend));
      expect(d.parse('m = 200 g, k = 80 N/m, A = 5 cm')).toEqual(parseSim('m = 200 g, k = 80 N/m, A = 5 cm'));
      for (const s of data) {
        expect(d.text(s)).toBe(simText(s));
        expect(d.dataLine(s)).toBe(dataLine(s));
        expect(d.answers(s)).toEqual(simLines(s, pend, vert));
        expect(d.periodMs!(s)).toBe(periodMs(s, pend, vert));
      }
    }
  });
  it('οι τιμές της στιγμής: όσο κινείται, ή όταν κρατιέται σε θέση· αλλιώς τίποτα', () => {
    const d = stampSim('spring')!, s = { m: 2, k: 200, A: 0.1 };
    expect(d.live!(s, { d: 0, amp: 0 })).toBeNull();
    expect(d.live!(s, { d: 30, amp: 30, pinned: true })).toBe(liveLine(s, false, 1, undefined, undefined, false));
    expect(d.live!(s, { d: 0, amp: 30, ph: 1, fade: 1 })).toBe(liveLine(s, false, Math.cos(1), 1, 1, false));
  });
  it('το πλαίσιο του οριζόντιου ελατηρίου αρχίζει πιο κοντά στο σχήμα', () => {
    expect(stampSim('spring')!.gap).toBe(0.8);
    expect(stampSim('pendulum')!.gap).toBe(1.4);
  });
  it('σχήματα χωρίς τιμές, άγνωστα ονόματα και ονόματα του Object δεν έχουν ορισμό', () => {
    expect(stampSim('incline')).toBeNull();
    expect(stampSim('waveT')).toBeNull();
    expect(stampSim('δεν-υπάρχει')).toBeNull();
    expect(stampSim('constructor')).toBeNull();
  });
  it('σημαία beta: σε όλο το σχήμα ή μόνο στις τιμές του', () => {
    const def = STAMPS.spring.sim!;
    STAMPS.zzBeta = { ...STAMPS.spring, beta: true };
    STAMPS.zzSimBeta = { ...STAMPS.spring, sim: { ...def, beta: true } };
    try {
      expect(stampSim('zzBeta', false)).toBeNull();
      expect(stampSim('zzBeta', true)).toBe(def);
      expect(stampSim('zzSimBeta', false)).toBeNull();
      expect(stampSim('zzSimBeta', true)).toBeTruthy();
    } finally {
      delete STAMPS.zzBeta;
      delete STAMPS.zzSimBeta;
    }
  });
  it('το πλαίσιο: δεδομένα, απαντήσεις ανά τρεις, τιμές της στιγμής, θέση κάτω από το σχήμα ή όπου σύρθηκε', () => {
    const sp: StampItem = { kind: 'stamp', id: 's', name: 'spring', x: 0, y: 0, w: 380, h: 100, color: '#000', width: 3, sim: { m: 2, k: 200, A: 0.1 } };
    const still = { springState: () => ({ d: 0, amp: 0 }) };
    const r = simRows(still, sp)!;
    const answers = stampSim('spring')!.answers(sp.sim!);
    expect(r.rows[0]).toBe(stampSim('spring')!.dataLine(sp.sim!));
    expect(r.rows[1]).toBe(answers.slice(0, 3).join('   '));
    expect(r.rows).toHaveLength(1 + Math.ceil(answers.length / 3));
    expect(r.x0).toBe(0);
    expect(r.y0).toBeCloseTo(100 + r.fs * 0.8);
    // όσο ταλαντώνεται: και οι τιμές της στιγμής
    const moving = simRows({ springState: () => ({ d: 0, amp: 30, ph: 0, fade: 1 }) }, sp)!;
    expect(moving.rows.at(-1)).toMatch(/^x = /);
    // το εκκρεμές αρχίζει πιο κάτω· σύρσιμο και σβήσιμο
    const pend = simRows(still, { ...sp, name: 'pendulum', sim: { L: 1 } })!;
    expect(pend.y0).toBeCloseTo(100 + pend.fs * 1.4);
    const moved = simRows(still, moveSim(moveSim(sp, 10, 20), 5, -5))!;
    expect([moved.x0, moved.y0]).toEqual([15, r.y0 + 15]);
    expect(simRows(still, { ...sp, simOff: true })).toBeNull();
    expect(simRows(still, { ...sp, sim: undefined })).toBeNull();
    // σχήμα χωρίς τιμές δεν έχει πλαίσιο, ακόμα κι αν έχει δεδομένα
    expect(simRows(still, { ...sp, name: 'waveT' })).toBeNull();
  });
});
