import { describe, expect, it } from 'vitest';
import { KIDS, ncCell, ncPack, ncStartH, ncState, type NCube } from '../src/kids';
import { ncRandom } from '../src/kids/numcubes';

/** Κυβάκια και αριθμοί: οι τέσσερις πράξεις της εξίσωσης (+ − × :). */
describe('κυβάκια και αριθμοί: πράξεις', () => {
  const d = KIDS.numcubes, W = d.w, H = d.h;
  const S = Math.min(W / 28, (H * 0.78) / 13), ox = (W - 28 * S) / 2, oy = H * 0.78 - 13 * S;
  const px = (cx: number, cy: number): [number, number] => [ox + cx * S, oy + cy * S];
  const OP = px(9.5, 4.9), EQ = px(18.5, 4.9);
  const slot = (k: number, n: number, h = ncStartH(n)): NCube => ({ x: [50, 140, 230][k], y: 65, n, h, acc: 0, col: 0, f: 16 });
  const scene = (flags: number, ...cubes: NCube[]): number[] => ncPack({ mode: 0, sel: 0, flags, cubes });
  const tap = (v: number[], at: [number, number]): number[] => d.paint!(v, ...at, W, H, {}, true)!;
  const result = (v: number[]): NCube | undefined => ncState(v).cubes.find((e) => e.f & 16 && e.x > 200);
  const rows = (e: NCube): number[][] => {
    // στήλες και σειρές κάθε κυβακιού
    const cells = Array.from({ length: e.n }, (_, i) => ncCell(e, i));
    return [Math.max(...cells.map((c) => c[0])) + 1, Math.max(...cells.map((c) => c[1])) + 1];
  };

  it('το σύμβολο γυρνά + → − → × → ÷ → + και μένει στα αποθηκευμένα', () => {
    let v = scene(16, slot(0, 3), slot(1, 4));
    const flags: number[] = [];
    for (let i = 0; i < 5; i++) {
      v = tap(v, OP);
      flags.push(ncState(v).flags & (32 | 256 | 512));
    }
    expect(flags).toEqual([32, 256, 512, 0, 32]);
    // ό,τι αποθηκεύτηκε, ξανανοίγει με την ίδια πράξη
    expect(ncState(ncPack(ncState(v))).flags & 32).toBe(32);
    expect(ncState(scene(16 | 256)).flags & 256).toBe(256);
    // παλιά μαθήματα με − (32) ανοίγουν όπως πριν και το = αφαιρεί
    const old = tap(scene(16 | 32, slot(0, 9), slot(1, 4)), EQ);
    expect(result(old)!.n).toBe(5);
  });

  it('× βγάζει στη θέση 3 ορθογώνιο a σειρών με b στήλες και χοντρές γραμμές (F_ARR)', () => {
    const v = tap(scene(16 | 256, slot(0, 3), slot(1, 4)), EQ);
    const r = result(v)!;
    expect(r.n).toBe(12);
    expect(r.f & 32).toBe(32);
    expect(rows(r)).toEqual([4, 3]);
    // κάθε κυβάκι στη θέση της: 3 σειρές των 4, στήλη στήλη
    expect(new Set(Array.from({ length: 12 }, (_, i) => ncCell(r, i).join())).size).toBe(12);
    expect(ncState(v).flags & 64).toBe(0);
    // όλα τα a, b ως 10 βγαίνουν ως ακριβές ορθογώνιο
    for (let a = 1; a <= 10; a++)
      for (let b = 1; b <= 10; b++) {
        const e = result(tap(scene(16 | 256, slot(0, a), slot(1, b)), EQ))!;
        expect(e.n).toBe(a * b);
        expect(rows(e)).toEqual([b, a]);
      }
    // μεγάλο γινόμενο: χωρά με zoom out (η εξίσωση απλώνεται)
    const big = tap(scene(16 | 256, slot(0, 9), slot(1, 8)), EQ);
    expect(ncState(big).flags & 12).toBeGreaterThan(0);
    expect(result(big)!.n).toBe(72);
  });

  it('η γραμμή των σειρών φεύγει όταν ο χαρακτήρας πιαστεί ή αλλάξει η πράξη', () => {
    const v = tap(scene(16 | 256, slot(0, 3), slot(1, 4)), EQ);
    expect(result(v)!.f & 32).toBe(32);
    const next = tap(v, OP);
    expect(ncState(next).cubes.every((e) => !(e.f & 32))).toBe(true);
  });

  it('× και ÷: η σωστή απάντηση των παιδιών δίνει ✓ (και το ορθογώνιο)· η λάθος ✗', () => {
    const mul = (ans: number): number[] => tap(scene(16 | 256, slot(0, 3), slot(1, 4), slot(2, ans)), EQ);
    const ok = mul(12);
    expect(ncState(ok).flags & 64).toBe(64);
    expect(d.fx!(scene(16 | 256, slot(0, 3), slot(1, 4), slot(2, 12)), ok)).toBe('cheer');
    expect(rows(result(ok)!)).toEqual([4, 3]);
    expect(result(ok)!.f & 32).toBe(32);
    const bad = mul(11);
    expect(ncState(bad).flags & 128).toBe(128);
    expect(d.fx!(scene(16 | 256, slot(0, 3), slot(1, 4), slot(2, 11)), bad)).toBe('bad');
    const div = (ans: number): number[] => tap(scene(16 | 512, slot(0, 12), slot(1, 3), slot(2, ans)), EQ);
    expect(ncState(div(4)).flags & 64).toBe(64);
    expect(ncState(div(3)).flags & 128).toBe(128);
  });

  it('÷ βγάζει το πηλίκο· όχι ακριβής διαίρεση: ✗', () => {
    const v = tap(scene(16 | 512, slot(0, 12), slot(1, 3)), EQ);
    expect(result(v)!.n).toBe(4);
    expect(ncState(v).flags & 128).toBe(0);
    // τα καλάθια φαίνονται όσο ισχύει το αποτέλεσμα (και με S_DONE)
    expect(ncState(v).flags & 1024).toBe(1024);
    const no = tap(scene(16 | 512, slot(0, 13), slot(1, 3)), EQ);
    expect(ncState(no).flags & 128).toBe(128);
    expect(result(no)).toBeUndefined();
    expect(d.fx!(scene(16 | 512, slot(0, 13), slot(1, 3)), no)).toBe('bad');
    // και διαίρεση με μεγαλύτερο διαιρέτη
    expect(ncState(tap(scene(16 | 512, slot(0, 2), slot(1, 5)), EQ)).flags & 128).toBe(128);
    // τα μεγάλα (90 : 9) απλώνουν την εξίσωση με zoom out και ζωγραφίζονται χωρίς σφάλμα
    const big = tap(scene(16 | 512, slot(0, 90), slot(1, 9)), EQ);
    expect(result(big)!.n).toBe(10);
    expect(ncState(big).flags & 12).toBeGreaterThan(0);
  });

  it('🎲 διαλέγει και την πράξη: και οι τέσσερις βγαίνουν, με τις σημαίες τους και γεμάτες τις θέσεις 1 και 2', () => {
    const dice = px(9.5, 2);
    const ops = new Set<number>();
    try {
      for (const r of [0.1, 0.3, 0.6, 0.9]) {
        // το πρώτο random διαλέγει πράξη, τα επόμενα την άσκηση
        const seq = [r, 0.5, 0.5];
        let i = 0;
        ncRandom.rand = () => seq[i++ % seq.length];
        const s = ncState(tap(scene(16), dice));
        const a = s.cubes.find((e) => e.x === 50)!, b = s.cubes.find((e) => e.x === 140)!;
        expect(s.cubes.some((e) => e.x > 200)).toBe(false);
        const op = [0, 32, 256, 512].indexOf(s.flags & (32 | 256 | 512));
        expect(op).toBe([0.1, 0.3, 0.6, 0.9].indexOf(r));
        ops.add(op);
        if (op === 3) expect(a.n % b.n).toBe(0);
      }
    } finally {
      ncRandom.rand = Math.random;
    }
    expect(ops.size).toBe(4);
  });
});
