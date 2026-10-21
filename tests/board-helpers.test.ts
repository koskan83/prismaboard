import { describe, expect, it } from 'vitest';
import { eraseMeasures, hlFlat, measureAngles, measureSides, radText } from '../src/board';
import { Pt, Shape } from '../src/model';

const tri = (pts: Pt[]): Shape => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { kind: 'shape', id: 't', shape: 'triangle', pts, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), color: '#111111', width: 4 };
};

describe('μετρήσεις τριγώνου', () => {
  it('οι γωνίες έχουν πάντα άθροισμα 180', () => {
    // ψευδοτυχαία τρίγωνα, ίδια σε κάθε εκτέλεση
    let seed = 7;
    const rnd = (): number => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 600;
    for (let i = 0; i < 500; i++) {
      const t = tri([[rnd(), rnd()], [rnd(), rnd()], [rnd(), rnd()]]);
      const a = measureAngles(t);
      expect(a.reduce((s, m) => s + m.deg, 0)).toBe(180);
    }
  });
  it('ορθογώνιο τρίγωνο 3-4-5', () => {
    const t = tri([[0, 0], [120, 0], [0, 160]]);
    expect(measureAngles(t).map((m) => m.deg)).toEqual([90, 53, 37]);
    expect(measureSides(t).map((m) => Math.round(m.len))).toEqual([120, 200, 160]);
  });
  it('οι διακεκομμένες βοηθητικές γραμμές δεν μετριούνται', () => {
    expect(measureSides({ ...tri([[0, 0], [120, 0], [0, 160]]), dash: true })).toEqual([]);
  });
});

describe('ακτίνια και χρώμα υπογραμμιστικού', () => {
  it('μοίρες ως κλάσμα του π', () => {
    expect(radText(0)).toBe('0');
    expect(radText(30)).toBe('π/6');
    expect(radText(135)).toBe('3π/4');
    expect(radText(180)).toBe('π');
    expect(radText(270)).toBe('3π/2');
    expect(radText(37)).toBe('37π/180');
  });
  it('το υπογραμμιστικό γίνεται αδιαφανές χρώμα πάνω στο φόντο', () => {
    expect(hlFlat('#fde047', [255, 255, 255])).toBe('rgb(254,244,191)');
    expect(hlFlat('yellow', [255, 255, 255])).toBeNull();
  });
});

describe('γόμα πάνω σε μετρήσεις', () => {
  const tri: Shape = { kind: 'shape', id: 't', shape: 'triangle', x0: 0, y0: 0, x1: 400, y1: 300, pts: [[0, 300], [400, 300], [0, 0]], color: '#111111', width: 3, meas: { len: true, ang: true, area: true } };
  it('πάνω σε μήκος σβήνει μόνο τα μήκη', () => {
    const p = measureSides(tri)[0].pos;
    const r = eraseMeasures(tri, p[0], p[1], 10) as Shape;
    expect(r.meas).toEqual({ len: false, ang: true, area: true });
  });
  it('πάνω σε γωνία σβήνει μόνο τις γωνίες', () => {
    const p = measureAngles(tri)[1].pos;
    expect((eraseMeasures(tri, p[0], p[1], 10) as Shape).meas?.ang).toBe(false);
  });
  it('στο κέντρο σβήνει το εμβαδόν', () => {
    expect((eraseMeasures(tri, 400 / 3, 200, 10) as Shape).meas?.area).toBe(false);
  });
  it('μακριά από ετικέτες ή χωρίς μετρήσεις δεν κάνει τίποτα', () => {
    expect(eraseMeasures(tri, 900, 900, 10)).toBeNull();
    expect(eraseMeasures({ ...tri, meas: undefined }, 200, 318, 10)).toBeNull();
  });
});

describe('ρόμβος και παραλληλόγραμμο', () => {
  const para: Shape = { kind: 'shape', id: 'p', shape: 'para', x0: 0, y0: 0, x1: 400, y1: 200, color: '#111111', width: 3 };
  const rh: Shape = { kind: 'shape', id: 'h', shape: 'rhombus', x0: 0, y0: 0, x1: 300, y1: 200, color: '#111111', width: 3 };
  it('τέσσερις πλευρές και γωνίες με άθροισμα 360', () => {
    expect(measureSides(para)).toHaveLength(4);
    for (const s of [para, rh]) {
      const a = measureAngles(s);
      expect(a).toHaveLength(4);
      expect(a.reduce((t, x) => t + x.deg, 0)).toBe(360);
      expect(a[0].deg).toBe(a[2].deg);
    }
  });
  it('ο ρόμβος έχει ίσες πλευρές', () => {
    const L = measureSides(rh).map((m) => m.len);
    expect(Math.max(...L) - Math.min(...L)).toBeLessThan(1e-9);
  });
});

import { CM_UNITS, sideLen, sideSlope, sideText, unitsFor } from '../src/measure';
import type { AxesItem, Shape as Sh } from '../src/model';

describe('μέτρηση μέσα σε άξονες', () => {
  // άξονες στο (400, 400), 40 μονάδες πίνακα ανά γραμμή, x: 5 ανά γραμμή, y: 10 ανά γραμμή
  const ax: AxesItem = { kind: 'axes', id: 'a', x: 400, y: 400, unit: 40, mode: 'q1', nx: 10, ny: 10, color: '#111111', sx: 5, sy: 10 };
  const line = (x0: number, y0: number, x1: number, y1: number): Sh => ({ kind: 'shape', id: 's', shape: 'line', x0, y0, x1, y1, color: '#111111', width: 3 });
  it('σχήμα πάνω στους άξονες μετριέται στις μονάδες τους, αλλιώς σε εκατοστά', () => {
    expect(unitsFor([ax], line(440, 360, 520, 360))).toEqual({ kx: 5 / 40, ky: 10 / 40, axes: true });
    expect(unitsFor([ax], line(40, 40, 120, 40))).toBe(CM_UNITS);
    expect(unitsFor([ax], { ...line(440, 360, 520, 360), rot: 0.3 })).toBe(CM_UNITS);
  });
  it('οριζόντια και κατακόρυφα μήκη, κλίση για τα πλάγια', () => {
    const u = unitsFor([ax], line(440, 360, 520, 360));
    expect(sideLen({ a: [440, 360], b: [520, 360] }, u)).toBeCloseTo(10);
    expect(sideLen({ a: [440, 360], b: [440, 240] }, u)).toBeCloseTo(30);
    expect(sideLen({ a: [440, 360], b: [520, 240] }, u)).toBeNull();
    // 2 γραμμές δεξιά (10) και 3 γραμμές πάνω (30): κλίση 3
    expect(sideSlope({ a: [440, 360], b: [520, 240] }, u)).toBeCloseTo(3);
    expect(sideText({ a: [440, 360], b: [520, 240], len: 144 }, u, true)).toBe('λ = 3');
    expect(sideText({ a: [440, 360], b: [520, 360], len: 80 }, u, true)).toBe('10');
  });
  it('σε άξονες με ίδια κλίμακα η ευθεία δείχνει μήκος και κλίση', () => {
    const u = unitsFor([{ ...ax, sx: undefined, sy: undefined }], line(440, 360, 560, 200));
    expect(sideText({ a: [440, 360], b: [560, 200], len: 200 }, u, true)).toBe('5   λ = 1,33');
    expect(sideText({ a: [440, 360], b: [560, 200], len: 200 }, u, false)).toBe('5');
  });
  it('χωρίς άξονες μένουν τα εκατοστά', () => expect(sideText({ a: [0, 0], b: [120, 0], len: 120 }, CM_UNITS, true)).toBe('3'));
});

import { KIDS } from '../src/kids';

describe('άσκηση με το 🎯 στα εργαλεία του Δημοτικού', () => {
  const at = (name: string, v: number[], fx: number, fy: number): number[] | null => {
    const d = KIDS[name];
    return d.tap!(v, fx * d.w, fy * d.h, d.w, d.h);
  };
  it('κλάσμα: το 🎯 ζητά γνήσιο κλάσμα σε άδειο σχήμα και κρατά την όψη', () => {
    for (let i = 0; i < 30; i++) {
      const v = at('fracbar', [4, 5, 1], 0.32, 0.75)!;
      expect(v[1]).toBe(0);
      expect(v[2]).toBe(1);
      expect(v[3]).toBeGreaterThanOrEqual(1);
      expect(v[3]).toBeLessThan(v[0]);
    }
  });
  it('κλάσμα: ο στόχος μένει όσο χρωματίζεις, πανηγυρισμός μόλις γίνουν όσα ζητούνται, και φεύγει αν αλλάξει ο παρονομαστής', () => {
    const d = KIDS.fracbar;
    const one = at('fracbar', [4, 0, 0, 2], 0.1, 0.2)!;
    expect(one).toEqual([4, 1, 0, 2]);
    expect(d.fx!([4, 0, 0, 2], one)).toBe('click');
    const two = at('fracbar', one, 0.9, 0.2)!;
    expect(two).toEqual([4, 9, 0, 2]);
    expect(d.fx!(one, two)).toBe('win');
    expect(at('fracbar', two, 0.68, 0.75)).toEqual([4, 9, 1, 2]);
    expect(at('fracbar', two, 0.86, 0.75)).toEqual([5, 0]);
    expect(d.fx!([4, 0], [4, 1])).toBe('click');
  });
  it('ρολόι: το 🎯 ζητά άλλη ώρα ανά 5 λεπτά και κρύβει την ψηφιακή· σωστό μόνο όταν αφήσεις τους δείκτες εκεί', () => {
    const d = KIDS.clock;
    const v = d.tap!([185, 1], d.w * 0.92, d.w * 0.08, d.w, d.h)!;
    expect(v[0]).toBe(185);
    expect(v[1]).toBe(0);
    expect((v[2] - 1) % 5).toBe(0);
    expect(v[2] - 1).not.toBe(185);
    expect(d.drop!([185, 0, 186])).toEqual({ v: [185, 0, 186, 1], ev: 'win' });
    expect(d.drop!([180, 0, 186])).toBeNull();
    expect(d.drop!([185, 0, 186, 1])).toBeNull();
    expect(d.drop!([185, 1])).toBeNull();
    // οι δείκτες κρατούν τον στόχο όσο σέρνονται, και το πλαίσιο της ώρας τελειώνει την άσκηση
    const c = d.w / 2, r = d.w * 0.47;
    expect(d.paint!([185, 0, 186, 1], c, c - r * 0.8, d.w, d.h, {}, true)).toEqual([180, 0, 186, 0]);
    expect(d.tap!([185, 0, 186, 1], d.w / 2, d.w + 10, d.w, d.h)).toEqual([185, 1]);
  });
  it('προπαίδεια: η γωνία ζητά γινόμενο, το σωστό κουτάκι πανηγυρίζει, και δεύτερο πάτημα στη γωνία σταματά την άσκηση', () => {
    const d = KIDS.times;
    const cell = (v: number[], q: number, r: number): number[] => at('times', v, (q + 1.5) / 11, (r + 1.5) / 11)!;
    for (let i = 0; i < 30; i++) {
      const v = at('times', [0, 0, 0, 0], 0.04, 0.04)!;
      expect(v.length).toBe(6);
      expect(v[4]).toBeGreaterThanOrEqual(4);
      expect(v[5]).toBe(0);
    }
    // ζητείται το 12: το 3×5 απλώς ανοίγει, το 3×4 (ή το 2×6) το βρίσκει
    const wrong = cell([0, 0, 0, 0, 12, 0], 2, 4);
    expect(wrong.slice(4)).toEqual([12, 0]);
    expect(d.fx!([0, 0, 0, 0, 12, 0], wrong)).toBe('click');
    const right = cell(wrong, 5, 1);
    expect(right.slice(4)).toEqual([12, 1]);
    expect(d.fx!(wrong, right)).toBe('win');
    expect(at('times', wrong, 0.04, 0.04)!.length).toBe(4);
    const next = at('times', right, 0.04, 0.04)!;
    expect(next[5]).toBe(0);
    expect(next[4]).not.toBe(12);
  });
  it('ψηφοφορία: κάθε πάτημα μετράει μία ψήφο, το 📊 δείχνει το αποτέλεσμα, το ⟳ μηδενίζει', () => {
    const d = KIDS.poll;
    let v = d.init!.slice();
    // 4 επιλογές: Β, Β, Δ
    v = at('poll', v, 0.38, 0.4)!;
    v = at('poll', v, 0.38, 0.4)!;
    v = at('poll', v, 0.88, 0.4)!;
    expect(v).toEqual([4, 0, 0, 2, 0, 1]);
    const shown = at('poll', v, 0.9, 0.89)!;
    expect(shown).toEqual([4, 1, 0, 2, 0, 1]);
    expect(d.fx!(v, shown)).toBe('drum');
    // με ψήφους το αριστερό κουμπί είναι ⟳· χωρίς ψήφους τα −/+ αλλάζουν πόσες είναι οι επιλογές
    expect(at('poll', shown, 0.08, 0.89)).toEqual([4, 0]);
    expect(at('poll', [4, 0], 0.08, 0.89)).toEqual([3, 0]);
    expect(at('poll', [5, 0], 0.2, 0.89)).toBeNull();
    expect(at('poll', [2, 0], 0.75, 0.4)).toEqual([2, 0, 0, 1]);
  });
  it('ζυγαριά: το 🎯 βάζει βαρίδια αριστερά που δεν αλλάζουν, και η ισορροπία από τα δεξιά πανηγυρίζει', () => {
    const d = KIDS.balance;
    const v = at('balance', [1, 0], 0.07, 0.1)!;
    expect(v[0]).toBe(3);
    expect(v[1]).toBe(2);
    expect(v.length).toBe(4);
    expect(v[2] + v[3]).toBeGreaterThan(10);
    expect(d.fx!([3, 2, 6, 7, 10], [3, 2, 6, 7, 10, 3])).toBe('win');
    expect(d.fx!([1, 2, 6, 7, 10], [1, 2, 6, 7, 10, 3])).toBe('equal');
    // άλυτη άσκηση: το 🎯 τη σταματά· λυμένη: δίνει καινούργια
    expect(at('balance', [3, 2, 6, 7, 10], 0.07, 0.1)).toEqual([1, 2, 6, 7, 10]);
    expect(at('balance', [3, 2, 6, 7, 10, 3], 0.07, 0.1)!.length).toBe(4);
  });
});

describe('εργαλεία Δημοτικού', () => {
  const tap = (name: string, v: number[], x: number, y: number): number[] | null => {
    const d = KIDS[name];
    return d.tap!(v, x * d.w, y * d.h, d.w, d.h);
  };
  it('ζυγαριά: τα βαρίδια μπαίνουν στη σωστή πλευρά και βγαίνουν με πάτημα', () => {
    // κουμπιά κάτω, για κάθε πλευρά δύο σειρές: 1–5 και 6–10. Αριστερά το 1 είναι πρώτο στην πάνω σειρά, δεξιά το 10 τελευταίο στην κάτω
    let v = tap('balance', [1, 0], 0.07, 0.8)!;
    expect(v).toEqual([1, 1, 1]);
    v = tap('balance', v, 0.642 + 0.072 * 4, 0.92)!;
    expect(v).toEqual([1, 1, 1, 10]);
    // όλα τα νούμερα από το 1 ως το 10 υπάρχουν και στις δύο πλευρές
    for (let n = 1; n <= 10; n++) {
      const y = n <= 5 ? 0.8 : 0.92, col = (n - 1) % 5;
      expect(tap('balance', [1, 0], 0.07 + 0.072 * col, y)).toEqual([1, 1, n]);
      expect(tap('balance', [1, 0], 0.642 + 0.072 * col, y)).toEqual([1, 0, n]);
    }
    // κρύψιμο της σύγκρισης στη μέση
    expect(tap('balance', v, 0.5, 0.86)).toEqual([0, 1, 1, 10]);
    expect(tap('balance', v, 0.5, 0.5)).toBeNull();
  });
  it('Ε Δ Μ: προστίθενται χιλιάδες και δεκάδες χιλιάδες, με κρατούμενο ως το 99.999', () => {
    // κουμπί «＋ Χιλιάδες» κάτω αριστερά· «− στήλη» κάτω δεξιά
    let v = tap('blocks', [234, 1], 0.12, 0.92)!;
    expect(v).toEqual([234, 1, 4]);
    v = tap('blocks', v, 0.12, 0.92)!;
    expect(v).toEqual([234, 1, 5]);
    expect(tap('blocks', v, 0.12, 0.92)).toEqual([234, 0, 5]);
    // + στις δεκάδες χιλιάδες (πρώτη στήλη, ως το 0,19 του πλάτους)
    const r = Math.min(0.24 * 400 * 0.2, 0.19 * 620 * 0.15) / 620;
    expect(tap('blocks', v, 0.19 - r * 1.5, 0.24 * 0.68)).toEqual([10234, 1, 5]);
    // κρατούμενο από τις μονάδες ως επάνω, και όριο στο 99.999
    expect(tap('blocks', [9999, 1, 5], 1 - (Math.min(19.2, 0.2 * 620 * 0.15) / 620) * 1.5, 0.24 * 0.68)).toEqual([10000, 1, 5]);
    expect(tap('blocks', [99999, 1, 5], 1 - (Math.min(19.2, 0.2 * 620 * 0.15) / 620) * 1.5, 0.24 * 0.68)).toBeNull();
    // αφαίρεση στήλης: ό,τι δεν χωρά πια φεύγει· στις τρεις στήλες η κατάσταση γυρίζει στην παλιά της μορφή
    expect(tap('blocks', [45678, 1, 5], 0.88, 0.92)).toEqual([5678, 1, 4]);
    expect(tap('blocks', [5678, 1, 4], 0.88, 0.92)).toEqual([678, 1]);
  });
  it('κλάσμα: πάτημα χρωματίζει κομμάτι, + και − αλλάζουν τον παρονομαστή', () => {
    expect(tap('fracbar', [4, 0], 0.1, 0.2)).toEqual([4, 1]);
    expect(tap('fracbar', [4, 1], 0.9, 0.2)).toEqual([4, 9]);
    expect(tap('fracbar', [4, 3], 0.86, 0.75)).toEqual([5, 0]);
    expect(tap('fracbar', [1, 0], 0.14, 0.75)).toBeNull();
    // όψη σοκολάτας / πίτσας: ανάβει από το κουμπί της και μένει όταν αλλάζουν τα κομμάτια ή ο παρονομαστής
    expect(tap('fracbar', [4, 1], 0.68, 0.75)).toEqual([4, 1, 1]);
    expect(tap('fracbar', [4, 1, 1], 0.68, 0.75)).toEqual([4, 1, 0]);
    expect(tap('fracbar', [4, 1, 1], 0.9, 0.2)).toEqual([4, 9, 1]);
    expect(tap('fracbar', [4, 3, 1], 0.86, 0.75)).toEqual([5, 0, 1]);
    expect(tap('fracpie', [4, 0], 0.9, 0.1 * 280 / 370)).toEqual([4, 0, 1]);
    expect(KIDS.fracpizza.init).toEqual([4, 0, 1]);
    expect(KIDS.fracchoc.init).toEqual([4, 0, 1]);
  });
  it('ρολόι: έξω τα λεπτά, μέσα η ώρα, κάτω η ψηφιακή ένδειξη', () => {
    const d = KIDS.clock, c = d.w / 2, r = d.w * 0.47;
    // λεπτοδείκτης στο «6» (30 λεπτά), με ώρα 3
    expect(d.paint!([180, 1], c, c + r * 0.8, d.w, d.h, {}, true)).toEqual([210, 1]);
    // ο λεπτοδείκτης πηγαίνει ανά λεπτό: 7 λεπτά, με ώρα 3
    const a7 = (7 / 60) * 2 * Math.PI;
    expect(d.paint!([180, 1], c + r * 0.8 * Math.sin(a7), c - r * 0.8 * Math.cos(a7), d.w, d.h, {}, true)).toEqual([187, 1]);
    // ωροδείκτης στο «9»
    expect(d.paint!([180, 1], c - r * 0.4, c, d.w, d.h, {}, true)).toEqual([540, 1]);
    // σύρσιμο του λεπτοδείκτη: μένει λεπτοδείκτης ακόμα κι αν το δάχτυλο περάσει πιο μέσα
    const st = {};
    d.paint!([180, 1], c, c + r * 0.8, d.w, d.h, st, true);
    expect(d.paint!([180, 1], c + r * 0.3, c, d.w, d.h, st, false)).toEqual([195, 1]);
    // έξω από το καντράν το σύρσιμο μετακινεί το ρολόι
    expect(d.paint!([180, 1], c, d.h - 10, d.w, d.h, {}, true)).toBeNull();
    expect(d.tap!([180, 1], c, d.h - 10, d.w, d.h)).toEqual([180, 0]);
  });
  it('υλικό δεκάδων: πάνω από 9 μηδενίζει και περνά ένα στην επόμενη στήλη', () => {
    const d = KIDS.blocks, head = d.h * 0.24, r = head * 0.2, ky = head * 0.68;
    const plus = (k: number): [number, number] => [[0.44, 0.72, 1][k] * d.w - r * 1.5, ky];
    const minus = (k: number): [number, number] => [[0, 0.44, 0.72][k] * d.w + r * 1.5, ky];
    expect(d.tap!([234, 1], ...plus(0), d.w, d.h)).toEqual([334, 1]);
    // 9 μονάδες + 1: οι μονάδες μηδενίζουν και οι δεκάδες γίνονται 4
    expect(d.tap!([239, 1], ...plus(2), d.w, d.h)).toEqual([240, 1]);
    // 9 δεκάδες + 1: περνά στις εκατοντάδες
    expect(d.tap!([294, 1], ...plus(1), d.w, d.h)).toEqual([304, 1]);
    // 0 μονάδες − 1: δανείζεται από τις δεκάδες
    expect(d.tap!([240, 1], ...minus(2), d.w, d.h)).toEqual([239, 1]);
    expect(d.tap!([999, 1], ...plus(2), d.w, d.h)).toBeNull();
    expect(d.tap!([0, 1], ...minus(2), d.w, d.h)).toBeNull();
  });
  it('πίνακας του 100 και προπαίδεια: το πάτημα σημειώνει το σωστό κουτί', () => {
    expect(tap('hundred', [0, 0, 0, 0], 0.05, 0.05)).toEqual([1, 0, 0, 0]);
    expect(tap('hundred', [0, 0, 0, 0], 0.95, 0.95)).toEqual([0, 0, 0, 1 << 24]);
    // 3 × 4: στήλη 4, γραμμή 3 → θέση 23
    expect(tap('times', [0, 0, 0, 0], 4.5 / 11, 3.5 / 11)).toEqual([1 << 23, 0, 0, 0]);
    expect(tap('times', [0, 0, 0, 0], 0.02, 0.5)).toBeNull();
  });
  it('χρήματα: πάτημα στην τράπεζα προσθέτει', () => {
    expect(tap('money', [1, 0, 0, 0, 0, 0, 0, 0, 0], 0.5 / 8, 0.1)).toEqual([1, 1, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('χτίσιμο με κυβάκια', () => {
  const d = KIDS.build, s = d.w / 24, slots = 19;
  it('σύρσιμο χτίζει με το επιλεγμένο υλικό· σβήνει μόνο το σφουγγάρι', () => {
    const st = {};
    let v = d.paint!([2], s * 0.5, s * 0.5, d.w, d.h, st, true)!;
    expect(v[1]).toBe(3);
    v = d.paint!(v, s * 1.5, s * 0.5, d.w, d.h, st, false)!;
    expect(v.slice(1, 4)).toEqual([3, 3, 0]);
    // το ίδιο κουτί ξανά στην ίδια κίνηση: καμία αλλαγή
    expect(d.paint!(v, s * 1.5, s * 0.5, d.w, d.h, st, false)).toBeNull();
    // νέα κίνηση πάνω σε κυβάκι του ίδιου υλικού: μένει, δεν σβήνει
    expect(d.paint!(v, s * 0.5, s * 0.5, d.w, d.h, {}, true)![1]).toBe(3);
    // άλλο υλικό πάνω του: το αντικαθιστά
    expect(d.paint!([6, ...v.slice(1)], s * 0.5, s * 0.5, d.w, d.h, {}, true)![1]).toBe(7);
    // σφουγγάρι (η θέση αμέσως μετά τα υλικά): σβήνει
    expect(d.paint!([slots - 2, ...v.slice(1)], s * 0.5, s * 0.5, d.w, d.h, {}, true)![1]).toBe(0);
  });
  it('η σειρά υλικών διαλέγει υλικό, και ο κάδος αδειάζει το χτίσιμο', () => {
    // στη σειρά υπάρχει και μια τελευταία θέση: «όλη η οθόνη» (ή η πόρτα επιστροφής)
    const y = s * 14 + (d.h - s * 14) / 2, sw = d.w / (slots + 1);
    expect(d.paint!([0, 1, 1], sw * 5.5, y, d.w, d.h, {}, true)![0]).toBe(5);
    expect(d.paint!([4, 1, 1], sw * (slots - 0.5), y, d.w, d.h, {}, true)).toEqual([4]);
    expect(d.fullAt!(sw * (slots + 0.5), y, d.w, d.h)).toBe(true);
    expect(d.fullAt!(sw * (slots - 0.5), y, d.w, d.h)).toBe(false);
    expect(d.paint!([4, 1, 1], sw * (slots + 0.5), y, d.w, d.h, {}, true)).toBeNull();
    // σύρσιμο που ξεκίνησε από τα υλικά δεν χτίζει
    const st = {};
    d.paint!([0], sw * 5.5, y, d.w, d.h, st, true);
    expect(d.paint!([5], s * 0.5, s * 0.5, d.w, d.h, st, false)).toBeNull();
  });
  it('χτίσιμο από το παλιό, μικρότερο πλέγμα δεν χάνεται', () => {
    const old = [0, ...new Array(160).fill(0)];
    old[1 + 9 * 16] = 2; // κάτω αριστερά στο 16 × 10
    const v = d.paint!(old, s * 5.5, s * 0.5, d.w, d.h, {}, true)!;
    expect(v[1 + 13 * 24]).toBe(2);
  });
});

import { hangNorm, hangStart, hangState } from '../src/kids';

describe('κρεμάλα', () => {
  const ABC = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
  const bitOf = (ch: string): number => 1 << ABC.indexOf(ch);
  it('η λέξη γίνεται κεφαλαία χωρίς τόνους', () => {
    expect(hangNorm('Σχολείο')).toBe('ΣΧΟΛΕΙΟ');
    expect(hangNorm('γαϊδούρι!')).toBe('ΓΑΙΔΟΥΡΙ');
    expect(hangNorm('λύκος')).toBe('ΛΥΚΟΣ');
  });
  it('το πρώτο και το τελευταίο γράμμα φαίνονται από την αρχή', () => {
    const v = hangStart('μπανάνα');
    const st = hangState(v);
    expect(st.word).toBe('ΜΠΑΝΑΝΑ');
    expect(st.mask).toBe(bitOf('Μ') | bitOf('Α'));
    expect(st.wrong).toBe(0);
    expect(st.won).toBe(false);
    expect(hangStart('α')).toEqual([0]);
  });
  it('πάτημα σε γράμμα: σωστό το ανοίγει, λάθος μετράει, και στα 6 λάθη χάνεται', () => {
    const d = KIDS.hangman;
    const key = (v: number[], ch: string): number[] | null => {
      const i = ABC.indexOf(ch), kw = (d.w * 0.62) / 8;
      return d.tap!(v, d.w * 0.36 + (i % 8 + 0.5) * kw, d.h * 0.4 + (Math.floor(i / 8) + 0.5) * d.h * 0.13, d.w, d.h);
    };
    let v = hangStart('ΒΙΒΛΙΟ');
    v = key(v, 'Ι')!;
    expect(hangState(v).wrong).toBe(0);
    // το ίδιο γράμμα δεύτερη φορά δεν κάνει τίποτα
    expect(key(v, 'Ι')).toBeNull();
    v = key(v, 'Λ')!;
    expect(hangState(v).won).toBe(true);
    expect(key(v, 'Ω')).toBeNull();
    let w = hangStart('ΒΙΒΛΙΟ');
    for (const ch of 'ΑΓΔΕΖ') w = key(w, ch)!;
    expect(hangState(w).wrong).toBe(5);
    expect(hangState(w).lost).toBe(false);
    w = key(w, 'Η')!;
    expect(hangState(w).lost).toBe(true);
    expect(key(w, 'Ι')).toBeNull();
  });
});

import { randomWords } from '../src/spell-lists';
import { spellDiff, spellGame, spellKeyboard, spellList, spellNorm, spellPack, spellState, type Spell } from '../src/kids';

describe('ορθογραφία με το τερατάκι', () => {
  const d = KIDS.spell;
  const game = (words: string[], more: Partial<Spell> = {}): number[] =>
    spellPack({ phase: 0, hand: false, peek: false, ready: false, en: false, said: false, acc: 0, idx: 0, sel: 0, dot: 0, words, hints: words.map(() => ''), res: words.map(() => 0), typed: '', marks: [], ...more });
  const EL = false, EN = true;
  /** Ένα πλήκτρο· τα τονισμένα γράφονται όπως σε κανονικό πληκτρολόγιο, με τον τόνο πρώτα. */
  const press1 = (v: number[], ch: string, en: boolean): number[] | null => {
    const k = spellKeyboard({ kx: d.w * 0.02, ky: d.h * 0.475, kw: d.w * 0.096, kh: d.h * 0.0975 }, en).find((q) => q.key === ch)!;
    return d.tap!(v, k.x + k.w / 2, k.y + k.h / 2, d.w, d.h);
  };
  const DEAD: Record<string, string> = { ά: '΄α', έ: '΄ε', ή: '΄η', ί: '΄ι', ό: '΄ο', ύ: '΄υ', ώ: '΄ω', ϊ: '΄΄ι', ϋ: '΄΄υ', ΐ: '΄΄΄ι', ΰ: '΄΄΄υ' };
  const key = (v: number[], ch: string, en = EL): number[] | null => [...(DEAD[ch] ?? ch)].reduce<number[] | null>((acc, c) => acc && press1(acc, c, en), v);
  const type = (v: number[], s: string, en = EL): number[] => [...s].reduce((acc, ch) => key(acc, ch, en)!, v);
  /** Τα κουμπιά κάτω: Λέξεις, 👁, τρόπος γραφής, Έλεγχος / Επόμενη, και (4) το 🔊. */
  const button = (k: number): [number, number] => [d.w * [0.0875, 0.2025, 0.4225, 0.75, 0.2875][k], d.h * 0.93];
  const press = (v: number[], k: number): number[] | null => d.tap!(v, ...button(k), d.w, d.h);
  it('κρατά τόνους και πεζά, χωρίς στίξη, σε ελληνικά και αγγλικά', () => {
    expect(spellNorm('  Το Σχολείο!  ')).toBe('το σχολείο');
    expect(spellNorm('ΠΑΪΔΆΚΙΑ')).toBe('παϊδάκια');
    expect(spellNorm('Don’t  Stop.')).toBe("don't stop");
    expect(spellList('μήλο, Καλή μέρα;  , apple\nσχολείο').words).toEqual(['μήλο', 'καλή μέρα', 'apple', 'σχολείο']);
    // μετά το «=» αυτό που βλέπει ο μαθητής· ανάποδα γραμμένο, ζητείται πάλι η αγγλική
    expect(spellList('Apple = μήλο, σκύλος=dog, φως')).toEqual({ words: ['apple', 'dog', 'φως'], hints: ['μήλο', 'σκύλος', ''] });
    // αγγλική από τις έτοιμες χωρίς «=»: παίρνει τη σημασία της· άγνωστη μένει χωρίς
    expect(spellList('school, spaceship').hints).toEqual(['σχολείο', '']);
    // χωρίς κόμμα: κάθε λέξη χωριστά· σημασία και με « - », «:» ή δύο στήλες από Excel· αρίθμηση και κουκκίδες φεύγουν
    expect(spellList('μήλο  σχολείο φως').words).toEqual(['μήλο', 'σχολείο', 'φως']);
    expect(spellList('apple - μήλο\r\ndog: σκύλος\ncat\tγάτα\nsun')).toEqual({ words: ['apple', 'dog', 'cat', 'sun'], hints: ['μήλο', 'σκύλος', 'γάτα', 'ήλιος'] });
    expect(spellList('1. μήλο\n• καλή μέρα').words).toEqual(['μήλο', 'καλή μέρα']);
    // νέο παιχνίδι από κείμενο: τα αγγλικά αναγνωρίζονται μόνα τους
    expect(spellState(spellGame('apple = μήλο, dog')!)).toMatchObject({ words: ['apple', 'dog'], hints: ['μήλο', 'σκύλος'], en: true, idx: 0, ready: false });
    expect(spellState(spellGame('μήλο')!).en).toBe(false);
    expect(spellGame(' , ')).toBeNull();
  });
  it('🎲: δέκα λέξεις στην τύχη από μία ή πολλές λίστες, με τη σημασία τους και χωρίς διπλές', () => {
    const a = 'α1 β1 γ1 δ1 ε1 ζ1 η1 θ1'.replace(/1/g, 'α').split(' ').join(', '), b = 'apple - μήλο\ndog = σκύλος\nαα\nμήλο σχολείο';
    const r = randomWords([a, b], 10);
    expect(r.count).toBe(11);
    const got = spellList(r.text);
    expect(got.words.length).toBe(10);
    expect(new Set(got.words).size).toBe(10);
    got.words.forEach((w, i) => w === 'apple' && expect(got.hints[i]).toBe('μήλο'));
    expect(randomWords(['μήλο, φως'], 10).count).toBe(2);
    expect(randomWords([], 10).text).toBe('');
  });
  it('αντιστοιχίζει λάθος, περιττό και γράμμα που λείπει', () => {
    const bad = (a: string, b: string): string => spellDiff(a, b).map((c) => (c.a === c.b ? '.' : c.a && c.b ? 's' : c.a ? 'x' : '+')).join('');
    expect(bad('σχολείο', 'σχολείο')).toBe('.......');
    expect(bad('σχολίο', 'σχολείο')).toBe('....+..');
    expect(bad('σχωλειο', 'σχολείο')).toBe('..s..s.');
    expect(bad('σχολλείο', 'σχολείο')).toMatch(/^\.{3,4}x\.{3,4}$/);
    expect(bad('οδοσ', 'οδός')).toBe('..ss');
  });
  it('η κατάσταση γράφεται και διαβάζεται ίδια· η παλιά (μία λέξη) ξεκινά από την αρχή', () => {
    const s: Spell = { phase: 1, hand: true, peek: true, ready: true, en: true, said: true, acc: 3, idx: 1, sel: 2, dot: 2, words: ['μήλο', 'good morning'], hints: ['', 'καλημέρα'], res: [12, 0], typed: 'go_d', marks: [false, false, true, false] };
    expect(spellState(spellPack(s))).toEqual(s);
    expect(spellState([1, 4, 956, 942, 955, 959, 956]).words).toEqual([]);
    expect(spellState(d.init!).words).toEqual([]);
  });
  it('αρχή: έτοιμες λέξεις ανά τάξη (η πρώτη φαίνεται), αγγλικά, ή δικές σου με κόμμα', () => {
    const ready = spellState(d.tap!(d.init!, d.w * 0.12, d.h * 0.57, d.w, d.h)!);
    expect(ready.words.length).toBe(8);
    expect(new Set(ready.words).size).toBe(8);
    expect(ready).toMatchObject({ ready: true, peek: true, idx: 0, en: false });
    const en = d.tap!(d.init!, d.w * 0.6, d.h * 0.42, d.w, d.h)!;
    expect(spellState(en).en).toBe(true);
    expect(d.tap!(en, d.w * 0.6, d.h * 0.42, d.w, d.h)).toBeNull();
    // οι έτοιμες αγγλικές δεν φαίνονται: ο μαθητής βλέπει τη σημασία τους στα ελληνικά
    const ready2 = d.tap!(en, d.w * 0.12, d.h * 0.57, d.w, d.h)!, r2 = spellState(ready2);
    expect(r2.words.every((x) => /^[a-z]+$/.test(x))).toBe(true);
    expect(r2.hints.every((x) => /^[α-ωά-ώ]+$/i.test(x))).toBe(true);
    expect(r2.peek).toBe(false);
    expect(d.fx!(en, ready2)).toBe(`say|en-GB|${r2.words[0]}`);
    const own = d.ask!(d.init!, d.w / 2, d.h * 0.79, d.w, d.h)!;
    expect(own).toMatchObject({ secret: true, voice: 'el-GR', lists: true });
    expect(d.ask!(en, d.w / 2, d.h * 0.79, d.w, d.h)!.voice).toBe('en-GB');
    expect(own.apply(' , ')).toBeNull();
    expect(spellState(own.apply('Μήλο, καλή μέρα')!)).toMatchObject({ words: ['μήλο', 'καλή μέρα'], res: [0, 0], ready: false, peek: false });
  });
  it('πλήκτρα όπως σε κανονικό πληκτρολόγιο: ο τόνος πριν από το φωνήεν, διαλυτικά με δεύτερο πάτημα', () => {
    const g = game(['προϊόν']);
    const acc = press1(g, '΄', EL)!;
    expect(spellState(acc).acc).toBe(1);
    expect(spellState(press1(acc, 'ο', EL)!)).toMatchObject({ typed: 'ό', acc: 0 });
    // σύμφωνο μετά τον τόνο: γράφεται σκέτο· το ⌫ ακυρώνει τον τόνο χωρίς να σβήσει γράμμα
    expect(spellState(press1(acc, 'π', EL)!).typed).toBe('π');
    expect(spellState(press1(type(g, 'π'), '΄', EL)!).typed).toBe('π');
    expect(spellState(press1(press1(type(g, 'π'), '΄', EL)!, '⌫', EL)!)).toMatchObject({ typed: 'π', acc: 0 });
    expect(spellState(type(g, 'προϊόν')).typed).toBe('προϊόν');
    expect(spellState(type(g, 'ϋΐΰ')).typed).toBe('ϋΐΰ');
    // το «;» κρατά μόνο τη θέση
    expect(press1(g, ';', EL)).toBeNull();
  });
  it('πλήκτρα: σβήσιμο, αλλαγή γράμματος στη μέση', () => {
    let v = type(game(['μήλο']), 'μιλω');
    expect(spellState(v).typed).toBe('μιλω');
    expect(spellState(key(v, '⌫')!).typed).toBe('μιλ');
    // πάτημα στο δεύτερο γράμμα το πιάνει· το επόμενο πλήκτρο το αλλάζει και η γραφή γυρίζει στο τέλος
    const cw = d.w * 0.08, x0 = (d.w - 4 * cw) / 2;
    v = d.tap!(v, x0 + cw * 1.5, d.h * 0.345 - cw * 0.6, d.w, d.h)!;
    expect(spellState(v).sel).toBe(2);
    v = key(v, 'ή')!;
    expect(spellState(v)).toMatchObject({ typed: 'μήλω', sel: 0 });
    expect(spellState(key(v, 'ς')!).typed).toBe('μήλως');
  });
  it('πρώτος έλεγχος: το τερατάκι τρώει τα λάθη και αφήνει κενές θέσεις· ο δεύτερος τρώει ό,τι έμεινε', () => {
    const typed = type(game(['καλημέρα', 'μήλο']), 'καλιμερα');
    const hint = press(typed, 3)!;
    expect(spellState(hint)).toMatchObject({ phase: 1, typed: 'καλ_μ_ρα', sel: 4, res: [12, 0] });
    expect(spellState(hint).marks).toEqual([false, false, false, true, false, true, false, false]);
    expect(d.fx!(typed, hint)).toBe('sniff2');
    // γεμίζει την πρώτη κενή θέση: πιάνεται μόνη της η επόμενη
    const one = key(hint, 'η')!;
    expect(spellState(one)).toMatchObject({ typed: 'καλημ_ρα', sel: 6 });
    // λάθος και στη δεύτερη προσπάθεια: το τρώει κι αυτό και φαίνεται το σωστό
    const again = key(one, 'ε')!, eaten = press(again, 3)!;
    expect(spellState(eaten)).toMatchObject({ phase: 2, typed: 'καλημερα', res: [13, 0] });
    expect(d.fx!(again, eaten)).toBe('munch1');
    expect(key(eaten, 'α')).toBeNull();
    // γεμίζει σωστά και τη δεύτερη: σωστή με τη δεύτερη, και τα δύο φαγωμένα μένουν στο τερατάκι
    const both = press(key(one, 'έ')!, 3)!;
    expect(spellState(both)).toMatchObject({ phase: 2, typed: 'καλημέρα', res: [102, 0] });
    expect(d.fx!(one, both)).toBe('cheer');
    // γράμμα που λείπει γίνεται κενή θέση· γράμμα που περισσεύει τρώγεται και φεύγει
    const gap = spellState(press(type(game(['σχολείο']), 'σχολίο'), 3)!);
    expect(gap).toMatchObject({ typed: 'σχολ_ίο', sel: 5 });
    expect(spellState(press(key(spellPack(gap), 'ε')!, 3)!)).toMatchObject({ phase: 2, res: [101] });
    const extra = press(type(game(['μήλο']), 'μήλοο'), 3)!;
    expect(spellState(extra)).toMatchObject({ phase: 1, typed: 'μήλο', sel: 0, res: [11] });
    expect(spellState(press(extra, 3)!)).toMatchObject({ phase: 2, res: [101] });
  });
  it('στο δέκατο λάθος το τερατάκι τρώει κι εσένα (ο ήχος έχει το «x») και η λίστα ξαναρχίζει', () => {
    const typed = type(game(['μήλο', 'φως'], { idx: 1, res: [18, 0] }), 'φοσ');
    expect(d.fx!(typed, press(typed, 3)!)).toBe('sniff2x');
    // μετά τη σκηνή, η ίδια λίστα από την αρχή: το επόμενο πάτημα παίζει την πρώτη λέξη, με το τερατάκι μικρό
    const fed = press(typed, 3)!;
    expect(spellState(fed).res).toEqual([18, 12]);
    expect(spellState(key(fed, 'μ')!)).toMatchObject({ idx: 0, phase: 0, typed: 'μ', res: [0, 0], words: ['μήλο', 'φως'] });
    expect(d.fx!(fed, key(fed, 'μ')!)).toBe('click');
    const before = type(game(['μήλο', 'φως'], { idx: 1, res: [14, 0] }), 'φοσ');
    expect(d.fx!(before, press(before, 3)!)).toBe('sniff2');
  });
  it('σωστή με την πρώτη, επόμενη λέξη, αποτελέσματα και ξανά', () => {
    let v = type(game(['μήλο', 'φως']), 'μήλο');
    const right = press(v, 3)!;
    expect(spellState(right)).toMatchObject({ phase: 2, res: [1, 0] });
    expect(d.fx!(v, right)).toBe('win');
    v = press(right, 3)!;
    expect(spellState(v)).toMatchObject({ phase: 0, idx: 1, typed: '' });
    // κάθε νέα λέξη λέγεται δυνατά· το 🔊 την ξαναλέει
    expect(d.fx!(right, v)).toBe('say|el-GR|φως');
    expect(d.fx!(v, press(v, 4)!)).toBe('say|el-GR|φως');
    v = press(press(press(type(v, 'φος'), 3)!, 3)!, 3)!;
    expect(spellState(v)).toMatchObject({ idx: 2, res: [1, 12] });
    // στα αποτελέσματα: «Ξανά οι ίδιες» και «Νέες λέξεις»
    expect(spellState(d.tap!(v, d.w * 0.25, d.h * 0.93, d.w, d.h)!)).toMatchObject({ idx: 0, res: [0, 0], words: ['μήλο', 'φως'] });
    expect(spellState(d.tap!(v, d.w * 0.75, d.h * 0.93, d.w, d.h)!).words).toEqual([]);
  });
  it('πάτημα στην κουκκίδα λέξης που τελείωσε δείχνει ποια ήταν· της επόμενης όχι', () => {
    // δύο λέξεις: η πρώτη σωστή, και τώρα παίζεται η δεύτερη
    const v = game(['μήλο', 'φως'], { idx: 1, res: [1, 0] });
    const pr = Math.min(d.h * 0.024, (d.w * 0.6) / 2 / 2.6), dot = (i: number): [number, number] => [d.w / 2 + (i - 0.5) * pr * 2.6, d.h * 0.05];
    const shown = d.tap!(v, ...dot(0), d.w, d.h)!;
    expect(spellState(shown).dot).toBe(1);
    expect(d.tap!(v, ...dot(1), d.w, d.h)).toBeNull();
    // ξανά πάτημα την κρύβει· πάτημα αλλού την κρύβει και κάνει ό,τι θα έκανε
    expect(spellState(d.tap!(shown, ...dot(0), d.w, d.h)!).dot).toBe(0);
    expect(spellState(key(shown, 'φ')!)).toMatchObject({ dot: 0, typed: 'φ' });
  });
  it('το 👁 δείχνει τη λέξη και το πρώτο πλήκτρο την κρύβει', () => {
    const shown = press(game(['μήλο']), 1)!;
    expect(spellState(shown).peek).toBe(true);
    expect(spellState(key(shown, 'μ')!)).toMatchObject({ peek: false, typed: 'μ' });
    expect(spellState(press(shown, 1)!).peek).toBe(false);
  });
  it('αγγλική λέξη: αγγλικά πλήκτρα QWERTY', () => {
    const v = type(game(["don't"]), "dont'", EN);
    expect(spellState(v).typed).toBe("dont'");
    expect(spellState(press(press(v, 3)!, 3)!)).toMatchObject({ phase: 2, res: [14] });
    expect(spellState(press(type(game(['cat']), 'cat', EN), 3)!).res).toEqual([1]);
  });
  it('με το χέρι: ο «Έλεγχος» διαβάζει το πλαίσιο· χωρίς ανάγνωση η τάξη κρίνει μόνη της', () => {
    const hand = press(game(['μήλο', 'φως']), 2)!;
    expect(spellState(hand).hand).toBe(true);
    // το πλαίσιο δεν είναι κουμπί, και τα κουμπιά του τα χειρίζεται το ask
    expect(d.tap!(hand, d.w / 2, d.h * 0.6, d.w, d.h)).toBeNull();
    expect(press(hand, 3)).toBeNull();
    const read = d.ask!(hand, ...button(3), d.w, d.h)!;
    expect(read.mode).toBe('read');
    expect(read.area!.y).toBeCloseTo(d.h * 0.475);
    const hint = read.apply('Μίλο')!;
    expect(spellState(hint)).toMatchObject({ phase: 1, typed: 'μ_λο', sel: 0, res: [11, 0] });
    expect(spellState(d.ask!(hint, ...button(3), d.w, d.h)!.apply('μήλο')!)).toMatchObject({ phase: 2, res: [101, 0] });
    // κενή ανάγνωση (χωρίς κλειδί ή ίντερνετ): φαίνεται η σωστή και πατιέται «Σωστά» ή «Λάθος»
    const manual = read.apply('')!;
    expect(spellState(manual).phase).toBe(3);
    expect(d.ask!(manual, ...button(3), d.w, d.h)).toBeNull();
    expect(spellState(d.tap!(manual, d.w * 0.61, d.h * 0.93, d.w, d.h)!)).toMatchObject({ phase: 2, res: [1, 0] });
    const wrong = d.tap!(manual, d.w * 0.86, d.h * 0.93, d.w, d.h)!;
    expect(spellState(wrong)).toMatchObject({ phase: 2, res: [11, 0], typed: '' });
    // η «Επόμενη», οι «Λέξεις» και η αλλαγή σε πλήκτρα σβήνουν ό,τι γράφτηκε στο πλαίσιο
    const next = d.ask!(wrong, ...button(3), d.w, d.h)!;
    expect(next.mode).toBe('clear');
    expect(spellState(next.apply('')!)).toMatchObject({ phase: 0, idx: 1, hand: true });
    expect(d.ask!(hand, ...button(0), d.w, d.h)!.mode).toBe('clear');
    expect(spellState(d.ask!(hand, ...button(2), d.w, d.h)!.apply('')!).hand).toBe(false);
    expect(d.ask!(game(['μήλο']), ...button(3), d.w, d.h)).toBeNull();
  });
});

import { ncCell, ncDrop, ncPack, ncShapes, ncStartH, ncState, type NCube } from '../src/kids';
import { ncExercise, ncRandom, type NCExercise } from '../src/kids/numcubes';

describe('κυβάκια και αριθμοί', () => {
  const d = KIDS.numcubes, W = d.w, H = d.h;
  // ίδια γεωμετρία με το ncGeom: σκηνή 28 × 13 κυβάκια πάνω από τη μπάρα (22% του ύψους)
  const S = Math.min(W / 28, (H * 0.78) / 13), ox = (W - 28 * S) / 2, oy = H * 0.78 - 13 * S;
  const mid = (e: NCube): [number, number] => [ox + (e.x / 10) * S, oy + (e.y / 10 - 0.5) * S];
  const cube = (x: number, n: number, h = Math.min(n, 10)): NCube => ({ x, y: 130, n, h, acc: 0, col: 0, f: 0 });
  const drag = (v: number[], from: [number, number], to: [number, number]): { v: number[]; ev: string } | null => {
    const st: Record<string, number> = {};
    let next = d.paint!(v, ...from, W, H, st, true)!;
    next = d.paint!(next, ...to, W, H, st, false) ?? next;
    return d.drop!(next);
  };

  it('τα σχήματα κάθε αριθμού', () => {
    expect(ncShapes(6)).toEqual([6, 3, 2, 1]);
    // οι μονοί ως το 9 δεν ξαπλώνουν: δύο ή τρεις στήλες με τα κυβάκια που περισσεύουν από πάνω
    expect(ncShapes(3)).toEqual([3, 2]);
    expect(ncShapes(5)).toEqual([5, 3, 2]);
    expect(ncShapes(7)).toEqual([7, 4, 3]);
    expect(ncShapes(9)).toEqual([9, 5, 3]);
    expect(ncShapes(16)).toEqual([10, 8, 4, 2]);
    expect(ncShapes(11)).toEqual([10, 4]);
    expect(ncShapes(23)).toEqual([10, 6, 5]);
    expect(ncShapes(50)).toEqual([10, 8, 5]);
  });

  it('μονοί αριθμοί όπως στα Numberblocks: σειρά σειρά από κάτω, και ό,τι περισσεύει από πάνω αριστερά', () => {
    const at = (n: number, h: number): [number, number][] => Array.from({ length: n }, (_, i) => ncCell({ x: 0, y: 0, n, h, acc: 0, col: 0, f: 0 }, i));
    // 7 σε δύο στήλες: 3 σειρές των 2 και ένα κυβάκι πάνω αριστερά
    expect(at(7, 4)).toEqual([[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3]]);
    // 7 σε τρεις στήλες: 2 σειρές των 3 και ένα πάνω αριστερά
    expect(at(7, 3).at(-1)).toEqual([0, 2]);
    // πύργοι, ορθογώνια και δεκάδες γεμίζουν όπως πριν, στήλη στήλη
    expect(at(6, 3)).toEqual([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]);
    expect(at(13, 10).at(-1)).toEqual([1, 2]);
    // 23 σε πέντε στήλες: 4 σειρές των 5 και τα 3 που περισσεύουν από πάνω αριστερά
    expect(at(23, 5).slice(-3)).toEqual([[0, 4], [1, 4], [2, 4]]);
    expect([3, 5, 7, 9, 4, 10, 23].map(ncStartH)).toEqual([3, 5, 7, 9, 4, 10, 10]);
  });

  it('σύρεις το 2 πάνω στο 3 και γίνονται 5', () => {
    const v = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(50, 2), cube(150, 3)] });
    const s = ncState(v);
    const r = drag(v, mid(s.cubes[0]), mid(s.cubes[1]))!;
    expect(r.ev).toBe('num|pop|5');
    expect(ncState(r.v).cubes.map((e) => [e.x, e.n, e.f])).toEqual([[150, 5, 0]]);
  });

  it('ενώνονται όταν αφήνεις τον έναν πάνω στον άλλον, και με ανοχή· όχι όμως όταν είναι απλώς δίπλα', () => {
    const v = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(50, 1), cube(150, 4)] });
    const s = ncState(v);
    const at = (x: number, feet: number): number => ncState(drag(v, mid(s.cubes[0]), [ox + x * S, oy + (feet - 0.5) * S])!.v).cubes.length;
    // το 4 στέκεται στο x 15 (πλάτος 1) και φτάνει ως το 9 από το 13, το 1 έχει πόδια στο «feet»
    expect(drag(v, mid(s.cubes[0]), [ox + 15 * S, oy + 9.1 * S])!.ev).toBe('num|pop|5');
    expect(at(15, 12)).toBe(1); // ακριβώς πάνω στο σώμα
    expect(at(15.5, 11)).toBe(1); // μισό κυβάκι έξω από το κέντρο
    expect(at(14.6, 10)).toBe(1); // και από την άλλη μεριά
    expect(at(15, 8)).toBe(1); // λίγο πάνω από το κεφάλι (πόδια ένα κυβάκι πάνω από την κορυφή)
    expect(at(15, 7.2)).toBe(2); // πολύ ψηλά: όχι
    // δίπλα στο γρασίδι: κολλητά ή με μικρό κενό, όχι
    expect(at(16, 13)).toBe(2);
    expect(at(16.3, 13)).toBe(2);
    expect(at(16.5, 12)).toBe(2);
    expect(at(13.7, 13)).toBe(2);
    const side = drag(v, mid(s.cubes[0]), [ox + 16.2 * S, oy + 12.5 * S])!;
    expect(ncState(side.v).cubes.map((e) => e.n)).toEqual([4, 1]);
  });

  it('🎲 η γεννήτρια ασκήσεων: και οι τέσσερις πράξεις, στα όρια τους, ακριβής διαίρεση, ποτέ η ίδια άσκηση δύο φορές στη σειρά', () => {
    let seed = 7;
    const rand = (): number => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    let prev: NCExercise | null = null;
    const count = [0, 0, 0, 0];
    let ones = 0;
    for (let i = 0; i < 4000; i++) {
      const x = ncExercise(rand, prev);
      expect(x.a).toBeGreaterThanOrEqual(1);
      expect(x.b).toBeGreaterThanOrEqual(1);
      if (x.op === 0) expect(x.a + x.b).toBeLessThanOrEqual(20);
      if (x.op === 1) {
        expect(x.a).toBeLessThanOrEqual(20);
        expect(x.b).toBeLessThan(x.a);
      }
      if (x.op === 2) {
        expect(Math.max(x.a, x.b)).toBeLessThanOrEqual(10);
        if (x.a === 1 || x.b === 1) ones++;
      }
      if (x.op === 3) {
        expect(x.b).toBeGreaterThanOrEqual(2);
        expect(x.b).toBeLessThanOrEqual(10);
        expect(x.a % x.b).toBe(0);
        expect(x.a / x.b).toBeLessThanOrEqual(10);
        expect(x.a).toBeLessThanOrEqual(100);
      }
      if (prev) expect(x).not.toEqual(prev);
      count[x.op]++;
      prev = x;
    }
    for (const n of count) expect(n).toBeGreaterThan(700);
    // το ×1 είναι σπάνιο
    expect(ones).toBeLessThan(count[2] * 0.3);
    // ακόμη κι αν το random δίνει πάντα το ίδιο, η άσκηση αλλάζει
    const once = ncExercise(() => 0);
    expect(ncExercise(() => 0, once)).not.toEqual(once);
    expect(ncExercise(() => 0.99, null, 5, 0)).toEqual({ a: 4, b: 1, op: 0 });
    expect(ncExercise(() => 0.99)).toEqual({ a: 100, b: 10, op: 3 });
  });

  it('🎲 στην εξίσωση: γεμίζει τις θέσεις 1 και 2, αφήνει την 3 άδεια, και η σωστή απάντηση με το = δίνει ✓', () => {
    const px = (cx: number, cy: number): [number, number] => [ox + cx * S, oy + cy * S];
    const dice = px(9.5, 2), eq = px(18.5, 4.9);
    const slotOf = (v: number[], k: number): NCube | undefined => ncState(v).cubes.find((e) => e.f & 16 && Math.abs(e.x - [50, 140, 230][k]) < 5);
    let v = ncPack({ mode: 0, sel: 0, flags: 16, cubes: [cube(60, 3), { ...cube(50, 2), f: 16, y: 65 }] });
    // το πρώτο random διαλέγει πράξη (0.1 → +), το δεύτερο την άσκηση
    const seq = [0.1, 0, 0.3, 0.5];
    let i = 0;
    ncRandom.rand = () => seq[i++ % seq.length];
    try {
      const before = v;
      v = d.paint!(v, ...dice, W, H, {}, true)!;
      expect(d.fx!(before, v)).toBe('tok');
      const s = ncState(v);
      // ό,τι ήταν στην εξίσωση έφυγε· ο χαρακτήρας στο γρασίδι έμεινε
      expect(s.cubes.filter((e) => !(e.f & 16)).map((e) => e.n)).toEqual([3]);
      const a = slotOf(v, 0)!, b = slotOf(v, 1)!;
      expect(slotOf(v, 2)).toBeUndefined();
      expect(s.flags & 32).toBe(0); // rand() = 0.1: πρόσθεση
      expect(a.n + b.n).toBeLessThanOrEqual(20);
      const sum = a.n + b.n;
      // τα παιδιά φτιάχνουν την απάντηση και πατούν το =
      s.cubes.push({ x: 230, y: 65, n: sum, h: ncStartH(sum), acc: 0, col: 0, f: 16 });
      v = ncPack(s);
      const ok = d.paint!(v, ...eq, W, H, {}, true)!;
      expect(ncState(ok).flags & 64).toBe(64);
      expect(d.fx!(v, ok)).toBe('cheer');
      // νέα άσκηση: το ✓ σβήνει και η θέση 3 αδειάζει
      const again = d.paint!(ok, ...dice, W, H, {}, true)!;
      expect(ncState(again).flags & (64 | 128)).toBe(0);
      expect(slotOf(again, 2)).toBeUndefined();
      expect([slotOf(again, 0)!.n, slotOf(again, 1)!.n]).not.toEqual([a.n, b.n]);
    } finally {
      ncRandom.rand = Math.random;
    }
  });

  it('🎲 αφαίρεση: το S_MINUS μπαίνει και το πρώτο είναι μεγαλύτερο από το δεύτερο· εκτός εξίσωσης το κουμπί δεν υπάρχει', () => {
    const dice: [number, number] = [ox + 9.5 * S, oy + 2 * S];
    ncRandom.rand = () => 0.3;
    try {
      const off = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(60, 3)] });
      expect(d.paint!(off, ...dice, W, H, {}, true)).toBeNull();
      const v = d.paint!(ncPack({ mode: 0, sel: 0, flags: 16, cubes: [] }), ...dice, W, H, {}, true)!;
      const s = ncState(v);
      expect(s.flags & 32).toBe(32);
      const [a, b] = s.cubes;
      expect(a.n).toBeGreaterThan(b.n);
    } finally {
      ncRandom.rand = Math.random;
    }
  });

  it('ενώνονται ως το 1000· πάνω από 1000 όχι, και ο κάδος σβήνει', () => {
    const ok = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(60, 60), cube(220, 50)] });
    const so = ncState(ok);
    expect(drag(ok, mid(so.cubes[0]), mid(so.cubes[1]))!.ev).toBe('num|pop|110');
    // μεγάλοι αριθμοί: ο ένας αφήνεται ακριβώς πάνω στον άλλον (με zoom out, για να χωρούν)
    const held = (n: number): NCube => ({ ...cube(300, n), f: 1 });
    expect(ncDrop(ncPack({ mode: 0, sel: 0, flags: 12, cubes: [cube(300, 600), held(400)] }))!.ev).toBe('num|pop|1000');
    expect(ncDrop(ncPack({ mode: 0, sel: 0, flags: 12, cubes: [cube(300, 600), held(500)] }))!.ev).toBe('bad');
    const v = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(60, 60), cube(220, 50)] });
    const s = ncState(v);
    const r = drag(v, mid(s.cubes[0]), [W * (8.5 / 10), H * 0.95])!;
    expect(r.ev).toBe('wipe');
    expect(ncState(r.v).cubes.map((e) => e.n)).toEqual([50]);
  });

  it('πάνω από το 100: οι εκατοντάδες γίνονται τετράγωνα 10 × 10, ως πέντε στη σειρά, και η σκηνή κάνει μόνη της zoom out', () => {
    const big = (n: number): NCube => ({ ...cube(0, n), h: 10 });
    // 1000 = 5 × 2 τετράγωνα: 50 στήλες, 20 σειρές, κάθε κυβάκι σε δική του θέση
    const cells = Array.from({ length: 1000 }, (_, i) => ncCell(big(1000), i).join());
    expect(new Set(cells).size).toBe(1000);
    expect(ncCell(big(1000), 999)).toEqual([49, 19]);
    // 234: δύο τετράγωνα, τρεις δεκάδες και οι μονάδες δίπλα τους
    expect([ncCell(big(234), 199), ncCell(big(234), 200), ncCell(big(234), 233)]).toEqual([[19, 9], [20, 0], [23, 3]]);
    // 60 + 50 = 110 χωρά· 600 + 300 = 900 χρειάζεται zoom out
    const r = ncDrop(ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(140, 600), { ...cube(140, 300), f: 1 }] }))!;
    expect(r.ev).toBe('num|pop|900');
    expect(ncState(r.v).flags & 12).toBeGreaterThan(0);
  });

  it('zoom out με − και + μόνο στη μεγάλη οθόνη· στο zoom in όσοι έμειναν έξω μπαίνουν μέσα', () => {
    const r = H * 0.22 * 0.17, minus: [number, number] = [r * 1.4, r * 1.4], plus: [number, number] = [r * 3.9, r * 1.4];
    let v = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(140, 5)] });
    // στον πίνακα το κουμπί δεν υπάρχει: το πάτημα δεν αλλάζει τίποτα
    expect(d.paint!(v, ...minus, W, H, {}, true)).toBeNull();
    v = d.paint!(v, ...minus, W, H, { full: 1 }, true)!;
    v = d.paint!(v, ...minus, W, H, { full: 1 }, true)!;
    expect(ncState(v).flags & 12).toBe(8);
    // με ×2 η σκηνή φτάνει ως το x = 42: ένας χαρακτήρας εκεί, ψηλά
    const s = ncState(v);
    s.cubes.push({ ...cube(400, 3), y: 20 });
    v = ncPack(s);
    v = d.paint!(v, ...plus, W, H, { full: 1 }, true)!;
    v = d.paint!(v, ...plus, W, H, { full: 1 }, true)!;
    const e = ncState(v).cubes[1];
    expect(ncState(v).flags & 12).toBe(0);
    expect(e.x).toBeLessThanOrEqual(280 - 5);
    expect(e.y).toBeGreaterThanOrEqual(39);
    // στο πιο κοντινό το + δεν κάνει τίποτα
    expect(d.paint!(v, ...plus, W, H, { full: 1 }, true)).toBe(v);
  });

  it('✂️ κόβει από το κυβάκι που πατήθηκε και πάνω· με απλό πάτημα το κομμάτι πάει δίπλα', () => {
    const v = ncPack({ mode: 1, sel: 0, flags: 0, cubes: [cube(100, 5)] });
    const st: Record<string, number> = {};
    // το τρίτο κυβάκι από κάτω
    const cut = d.paint!(v, ox + 10 * S, oy + 10.5 * S, W, H, st, true)!;
    expect(d.fx!(v, cut)).toBe('num|split|3');
    // δεύτερη επαφή στο ίδιο σημείο αμέσως μετά (διπλό άγγιγμα): δεν ξανακόβει
    expect(d.paint!(cut, ox + 10 * S, oy + 10.5 * S, W, H, {}, true)).toBe(cut);
    const r = ncDrop(cut)!;
    const [a, b] = ncState(r.v).cubes;
    expect([a.n, b.n, b.y, b.f]).toEqual([2, 3, 130, 0]);
    expect(b.x).toBeGreaterThan(a.x);
  });

  it('νέος αριθμός από την παλέτα, σχήμα, αξεσουάρ και 🧽 για έναν χαρακτήρα', () => {
    let v = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(40, 2)] });
    // πάτημα στο 9 της παλέτας: μπαίνει στη σκηνή, πάνω στο έδαφος
    v = ncDrop(d.paint!(v, W * 0.85, H * 0.83, W, H, {}, true)!)!.v;
    let e = ncState(v).cubes[1];
    expect([e.n, e.y]).toEqual([9, 130]);
    const tap = (bx: number, by: number): void => { v = d.paint!(v, bx, by, W, H, {}, true)!; };
    tap(W * (2.5 / 10), H * 0.95); // 🔄
    // το 9 μπαίνει όρθιο· με το 🔄 γίνεται δύο στήλες (5 + 4)
    expect(ncState(v).cubes[1].h).toBe(9);
    tap(...mid(ncState(v).cubes[1]));
    expect(ncState(v).cubes[1].h).toBe(5);
    tap(W * (3.5 / 10), H * 0.95); // 🎩
    expect(ncState(v).mode).toBe(4);
    tap(W * (2.5 / 13), H * 0.83); // κορώνα
    tap(...mid(ncState(v).cubes[1]));
    e = ncState(v).cubes[1];
    expect(e.acc).toBe(2);
    expect(d.fx!(ncPack({ ...ncState(v), cubes: ncState(v).cubes.map((q) => ({ ...q, acc: 0 })) }), v)).toBe('new');
    // ξανά το ίδιο: βγαίνει
    tap(...mid(e));
    expect(ncState(v).cubes[1].acc).toBe(0);
    tap(W * (4.5 / 10), H * 0.95); // 🧽
    tap(...mid(ncState(v).cubes[0]));
    expect(ncState(v).cubes.map((q) => q.n)).toEqual([9]);
  });

  it('⚖️ ζυγαριά: ό,τι αφήνεται πάνω από μια πιατέλα κάθεται πάνω της και γέρνει προς το μεγαλύτερο άθροισμα', () => {
    let v = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(60, 3), cube(220, 2), cube(275, 1)] });
    v = d.paint!(v, W * (6.5 / 10), H * 0.95, W, H, {}, true)!;
    let s = ncState(v);
    expect(s.flags & 2).toBe(2);
    // το 3 στην αριστερή πιατέλα, το 2 στη δεξιά· το 1, έξω από τις πιατέλες, μένει στο γρασίδι
    expect(s.cubes.map((e) => [e.f, e.y])).toEqual([[8, 102], [8, 102], [0, 130]]);
    // το 1 ανεβαίνει στα δεξιά: 3 = 3, ισορροπεί
    const r = drag(v, mid(s.cubes[2]), [ox + 18 * S, oy + 9 * S])!;
    expect(r.ev).toBe('tok');
    s = ncState(r.v);
    expect(s.cubes.filter((e) => e.f & 8).length).toBe(3);
    // σήκωμα από τη ζυγαριά και άφημα αριστερά στο γρασίδι, έξω από την πιατέλα: τότε κατεβαίνει
    const off = drag(r.v, [ox + 6 * S, oy + 9.8 * S], [ox + 1 * S, oy + 12.5 * S])!;
    expect(ncState(off.v).cubes.find((e) => e.n === 3)!.f).toBe(0);
    // βγαίνει η ζυγαριά: όλοι στο γρασίδι
    v = d.paint!(r.v, W * (6.5 / 10), H * 0.95, W, H, {}, true)!;
    expect(ncState(v).cubes.map((e) => [e.f, e.y])).toEqual([[0, 130], [0, 130], [0, 130]]);
  });

  it('+ = εξίσωση ψηλά στον ουρανό: όποιος αφήνεται σε θέση κάθεται εκεί, το = βγάζει το αποτέλεσμα ή ελέγχει την απάντηση', () => {
    const eqBtn: [number, number] = [W * (7.5 / 10), H * 0.95];
    const sign = (k: number): [number, number] => [ox + (k ? 18.5 : 9.5) * S, oy + 4.9 * S];
    let v = ncPack({ mode: 0, sel: 0, flags: 0, cubes: [cube(50, 3), cube(140, 2), cube(260, 1)] });
    v = d.paint!(v, ...eqBtn, W, H, {}, true)!;
    let s = ncState(v);
    expect(s.flags & 16).toBe(16);
    // όσοι είναι στο γρασίδι μένουν εκεί: οι θέσεις είναι στον ουρανό
    expect(s.cubes.map((e) => [e.y, e.f])).toEqual([[130, 0], [130, 0], [130, 0]]);
    // το 3 και το 2 ανεβαίνουν στις δύο πρώτες θέσεις
    v = drag(v, mid(s.cubes[0]), [ox + 5.5 * S, oy + 6 * S])!.v;
    s = ncState(v);
    const out = drag(v, mid(s.cubes.find((e) => e.n === 2)!), [ox + 13 * S, oy + 6.4 * S])!;
    v = out.v;
    // όποιος σύρθηκε πάει στο τέλος της λίστας
    expect(ncState(v).cubes.map((e) => [e.n, e.x, e.y, e.f])).toEqual([[1, 260, 130, 0], [3, 50, 65, 16], [2, 140, 65, 16]]);
    // = : στην άδεια τρίτη θέση εμφανίζεται το 5
    v = d.paint!(v, ...sign(1), W, H, {}, true)!;
    s = ncState(v);
    expect(s.cubes.at(-1)).toMatchObject({ x: 230, y: 65, n: 5, f: 16 });
    expect(d.fx!(out.v, v)).toBe('num|pop|5');
    // + → −: 3 − 2, και η απάντηση 5 είναι λάθος
    v = d.paint!(v, ...sign(0), W, H, {}, true)!;
    const before = v;
    v = d.paint!(v, ...sign(1), W, H, {}, true)!;
    expect(ncState(v).flags & (64 | 128)).toBe(128);
    expect(d.fx!(before, v)).toBe('bad');
    // η απάντηση γίνεται 1 (το 1 πάνω στην τρίτη θέση δεν ενώνεται με το 5: το 5 φεύγει πρώτα)
    s = ncState(v);
    v = drag(v, mid(s.cubes[3]), [ox + 1 * S, oy + 3 * S])!.v;
    s = ncState(v);
    v = drag(v, mid(s.cubes.find((e) => e.n === 1)!), [ox + 23 * S, oy + 6 * S])!.v;
    const ready = v;
    v = d.paint!(v, ...sign(1), W, H, {}, true)!;
    expect(ncState(v).flags & (64 | 128)).toBe(64);
    expect(d.fx!(ready, v)).toBe('cheer');
    // χωρίς δεύτερο αριθμό: λάθος, χωρίς αποτέλεσμα
    let w = ncPack({ mode: 0, sel: 0, flags: 16, cubes: [{ ...cube(50, 4), f: 16 }] });
    w = d.paint!(w, ...sign(1), W, H, {}, true)!;
    expect([ncState(w).cubes.length, ncState(w).flags & 128]).toEqual([1, 128]);
    // η ζυγαριά και η εξίσωση δεν είναι ποτέ μαζί
    v = d.paint!(v, W * (6.5 / 10), H * 0.95, W, H, {}, true)!;
    s = ncState(v);
    expect([s.flags & 2, s.flags & 16, s.cubes.some((e) => e.f & 16)]).toEqual([2, 0, false]);
  });

  it('όσοι κάθονταν στην παλιά τραμπάλα ανοίγουν πάνω στις πιατέλες της ζυγαριάς', () => {
    // παλιό μάθημα: σανίδα στο ύψος 11,4 και χαρακτήρας στη μέση της (x = 14,5): πάει στην αρχή της δεξιάς πιατέλας
    const s = ncState([0, 0, 2, 145, 114, 3, 3, 0, 0, 8, 40, 114, 2, 2, 0, 0, 8]);
    expect(s.cubes.map((e) => [e.x, e.y, e.f])).toEqual([[160, 102, 8], [40, 102, 8]]);
  });

  it('το παλιό βάψιμο (λειτουργία 3) γίνεται μετακίνηση', () => {
    expect(ncState([3, 1, 0]).mode).toBe(0);
  });
});

import { hitsLineAngle, lineAngleMark } from '../src/measure';

describe('γωνία ανάμεσα σε δύο ευθείες', () => {
  const ln = (id: string, x1: number, y1: number, angleWith?: string): Sh => ({ kind: 'shape', id, shape: 'line', x0: 0, y0: 0, x1, y1, color: '#000', width: 3, angleWith });
  const a = ln('a', 200, 0), b = ln('b', 0, -200, 'a');
  it('90° με τις μοίρες στη μέση του τόξου', () => {
    const m = lineAngleMark([a, b], b)!;
    expect(m.deg).toBe(90);
    expect(m.lx).toBeCloseTo(72 * Math.SQRT1_2);
    expect(m.ly).toBeCloseTo(-72 * Math.SQRT1_2);
  });
  it('η γόμα πιάνει τις μοίρες και το τόξο, όχι τις ευθείες μακριά από αυτά', () => {
    expect(hitsLineAngle([a, b], b, 51, -51, 6)).toBe(true);
    expect(hitsLineAngle([a, b], b, 46 * Math.cos(-0.3), 46 * Math.sin(-0.3), 6)).toBe(true);
    expect(hitsLineAngle([a, b], b, 150, 0, 6)).toBe(false);
    expect(hitsLineAngle([a, b], b, 46 * Math.cos(1), 46 * Math.sin(1), 6)).toBe(false);
  });
  it('κρυμμένη γωνία: δεν ζωγραφίζεται και η γόμα δεν τη βρίσκει', () => {
    const h = { ...b, noAng: true };
    expect(lineAngleMark([a, h], h)).toBeNull();
    expect(hitsLineAngle([a, h], h, 51, -51, 6)).toBe(false);
  });
});
