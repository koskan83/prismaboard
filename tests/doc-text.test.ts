import { describe, expect, it } from 'vitest';
import { runsToLines } from '../src/doc-text';

const run = (x: number, top: number, w: number, str: string, h = 20) => ({ x, top, w, h, str });

describe('κείμενο από PDF/Word σε γραμμές', () => {
  it('λέξεις στην ίδια σειρά γίνονται μία γραμμή με διαστήματα', () => {
    const lines = runsToLines([run(60, 100, 40, 'καλή'), run(10, 101, 40, 'Μια'), run(110, 99, 50, 'μέρα')]);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('Μια καλή μέρα');
    expect(lines[0].x).toBe(10);
    expect(lines[0].w).toBe(150);
  });
  it('κομμάτια που ακουμπούν ενώνονται χωρίς διάστημα', () => {
    expect(runsToLines([run(0, 0, 30, 'Οριζ'), run(30, 0, 40, 'όντια')])[0].text).toBe('Οριζόντια');
  });
  it('διαφορετικές σειρές και μεγάλα κενά (στήλες) δίνουν χωριστές γραμμές', () => {
    const lines = runsToLines([run(0, 0, 50, 'α'), run(300, 0, 50, 'β'), run(0, 30, 50, 'γ')]);
    expect(lines.map((l) => l.text)).toEqual(['α', 'β', 'γ']);
  });
  it('κενά κομμάτια αγνοούνται', () => {
    expect(runsToLines([run(0, 0, 10, '  '), run(20, 0, 10, '')])).toEqual([]);
  });
});
