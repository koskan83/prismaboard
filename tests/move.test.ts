import { describe, expect, it } from 'vitest';
import { mergeMove } from '../src/move-merge';

const idx = (...m: [string, number][]): string => JSON.stringify(m.map(([id, updated]) => ({ id, name: id, updated })));

describe('μεταφορά σε νέα διεύθυνση', () => {
  it('σε άδεια νέα διεύθυνση περνούν όλα', () => {
    const got: [string, string][] = [
      ['lessons', idx(['a', 1], ['b', 2])],
      ['lesson:a', 'A'], ['img:a:p1', 'PA'], ['lesson:b', 'B'],
      ['rosters', '{"Γ1":["Άννα"]}'], ['templates', '[1]'], ['lesson.current', '"a"'],
    ];
    const { put, lessons } = mergeMove(new Map(), got);
    expect(lessons).toBe(2);
    expect(new Map(put)).toEqual(new Map(got));
  });

  it('κρατά τα δικά της μαθήματα και παίρνει μόνο όσα λείπουν ή είναι νεότερα', () => {
    const have = new Map([
      ['lessons', idx(['a', 5], ['n', 3])],
      ['lesson:a', 'A-νέα'], ['lesson:n', 'N'],
      ['rosters', '{"Γ1":["Βασίλης"]}'], ['templates', '[9]'],
    ]);
    const got: [string, string][] = [
      ['lessons', idx(['a', 1], ['b', 2])],
      ['lesson:a', 'A-παλιά'], ['img:a:p1', 'PA'], ['lesson:b', 'B'], ['img:b:p1', 'PB'],
      ['rosters', '{"Γ1":["Άννα"],"Δ2":["Ελένη"]}'], ['templates', '[1]'],
    ];
    const { put, lessons } = mergeMove(have, got);
    const out = new Map(put);
    expect(lessons).toBe(1);
    expect(JSON.parse(out.get('lessons')!).map((m: { id: string }) => m.id)).toEqual(['a', 'n', 'b']);
    // το «a» είναι νεότερο εδώ: δεν αντικαθίσταται, ούτε οι εικόνες του
    expect(out.has('lesson:a')).toBe(false);
    expect(out.has('img:a:p1')).toBe(false);
    expect(out.get('lesson:b')).toBe('B');
    expect(out.get('img:b:p1')).toBe('PB');
    // τα τμήματα ενώνονται, με προτεραιότητα σε όσα υπάρχουν ήδη εδώ
    expect(JSON.parse(out.get('rosters')!)).toEqual({ Γ1: ['Βασίλης'], Δ2: ['Ελένη'] });
    expect(out.has('templates')).toBe(false);
  });

  it('νεότερο μάθημα στην παλιά διεύθυνση αντικαθιστά το ίδιο μάθημα εδώ', () => {
    const have = new Map([['lessons', idx(['a', 1])], ['lesson:a', 'A-πριν']]);
    const { put, lessons } = mergeMove(have, [['lessons', idx(['a', 9])], ['lesson:a', 'A-μετά']]);
    expect(lessons).toBe(1);
    expect(new Map(put).get('lesson:a')).toBe('A-μετά');
    expect(JSON.parse(new Map(put).get('lessons')!)[0].updated).toBe(9);
  });

  it('χαλασμένα δεδομένα δεν σβήνουν τίποτα', () => {
    const have = new Map([['lessons', idx(['a', 1])]]);
    const { put, lessons } = mergeMove(have, [['lessons', 'όχι json'], ['lesson:x', 'X']]);
    expect(lessons).toBe(0);
    expect(put).toEqual([]);
  });
});
