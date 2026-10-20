import { describe, expect, it } from 'vitest';
import { Doc, Item } from '../src/model';
import { cleanMeta, docRefs, fillDoc, slimDoc } from '../src/storage';

const big = (c: string): string => 'data:image/jpeg;base64,' + c.repeat(10000);
const pic = (id: string, src: string): Item => ({ kind: 'image', id, x: 0, y: 0, w: 100, h: 100, src });
const stroke: Item = { kind: 'stroke', id: 's', pts: [[0, 0], [5, 5]], color: '#111111', width: 4, hl: false };
const doc = (...pages: Item[][]): Doc => ({ v: 1, bg: 'white', pages: pages.map((items) => ({ items, view: { x: 0, y: 0, k: 1 } })) });

describe('εικόνες χωριστά από το μάθημα', () => {
  it('οι μεγάλες εικόνες βγαίνουν από τον πίνακα και ξαναμπαίνουν ίδιες', () => {
    const d = doc([pic('a', big('A')), stroke], [pic('b', big('B'))]);
    const { doc: slim, imgs } = slimDoc(d, new Map());
    expect(imgs.size).toBe(2);
    expect(JSON.stringify(slim).length).toBeLessThan(1000);
    expect(docRefs(slim).sort()).toEqual([...imgs.keys()].sort());
    const back = JSON.parse(JSON.stringify(slim)) as Doc;
    fillDoc(back, imgs);
    expect(back).toEqual(d);
  });
  it('ο πίνακας στη μνήμη δεν αλλάζει', () => {
    const src = big('A');
    const d = doc([pic('a', src)]);
    slimDoc(d, new Map());
    expect((d.pages[0].items[0] as { src: string }).src).toBe(src);
  });
  it('η ίδια εικόνα κρατά το όνομά της από αποθήκευση σε αποθήκευση και γράφεται μία φορά', () => {
    const ids = new Map<string, string>();
    const d = doc([pic('a', big('A'))], [pic('b', big('A'))]);
    const first = slimDoc(d, ids);
    expect(first.imgs.size).toBe(1);
    d.pages[0].items.push(stroke);
    expect([...slimDoc(d, ids).imgs.keys()]).toEqual([...first.imgs.keys()]);
  });
  it('οι μικρές εικόνες (π.χ. τύποι) μένουν μέσα στον πίνακα', () => {
    const d = doc([pic('m', 'data:image/svg+xml;charset=utf-8,%3Csvg%3E')]);
    const { doc: slim, imgs } = slimDoc(d, new Map());
    expect(imgs.size).toBe(0);
    expect(slim).toEqual(d);
  });
  it('εικόνα που δεν βρέθηκε μένει ως όνομα και δεν χαλάει τις υπόλοιπες', () => {
    const d = doc([pic('a', big('A')), pic('b', big('B'))]);
    const { doc: slim, imgs } = slimDoc(d, new Map());
    const back = JSON.parse(JSON.stringify(slim)) as Doc;
    const [lost] = imgs.keys();
    imgs.delete(lost);
    fillDoc(back, imgs);
    expect((back.pages[0].items[0] as { src: string }).src).toBe('idb:' + lost);
    expect((back.pages[0].items[1] as { src: string }).src).toBe(big('B'));
  });
});

describe('στοιχεία μαθήματος από αρχείο', () => {
  const ok = { id: 'lq3k9x0abcd', name: 'Κλάσματα', updated: 1700000000000, pages: 3, group: 'Β2', thumb: 'data:image/jpeg;base64,AAAA' };
  it('κρατά ένα σωστό μάθημα όπως είναι', () => {
    expect(cleanMeta(ok)).toEqual(ok);
  });
  it('απορρίπτει id ή αριθμούς σε λάθος μορφή', () => {
    expect(cleanMeta({ ...ok, id: 'x" onclick="a()' })).toBeNull();
    expect(cleanMeta({ ...ok, name: 5 as unknown as string })).toBeNull();
    expect(cleanMeta({ ...ok, updated: undefined })).toBeNull();
    expect(cleanMeta({ ...ok, pages: '3<img>' as unknown as number })).toBeNull();
    expect(cleanMeta(undefined)).toBeNull();
  });
  it('πετά μικρογραφία που δεν είναι εικόνα', () => {
    expect(cleanMeta({ ...ok, thumb: 'x" onerror="alert(1)' })?.thumb).toBeUndefined();
    expect(cleanMeta({ ...ok, thumb: 'javascript:alert(1)' })?.thumb).toBeUndefined();
  });
});
