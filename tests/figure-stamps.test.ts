import { describe, expect, it } from 'vitest';
import { parseFigureReply } from '../src/ai';
import { figureCatalog, figureStamp, figureStampNames, stampLetters } from '../src/figure-stamps';
import { betaStampNews } from '../src/news';
import { STAMPS } from '../src/stamps';

describe('σχήμα από εκφώνηση με τα έτοιμα σχήματα', () => {
  it('διαβάζει την εντολή S με θέση, πλάτος και τιμές', () => {
    expect(parseFigureReply('S incline 10 15 75 φ=30°; m=2 kg\nS spring 5 20 70 m=0,2 kg; k=80 N/m; A=5 cm\nS pendulum 50 5 30')).toEqual([
      { k: 'stamp', name: 'incline', x: 10, y: 15, w: 75, vals: [['φ', '30°'], ['m', '2 kg']] },
      { k: 'stamp', name: 'spring', x: 5, y: 20, w: 70, vals: [['m', '0,2 kg'], ['k', '80 N/m'], ['A', '5 cm']] },
      { k: 'stamp', name: 'pendulum', x: 50, y: 5, w: 30, vals: [] },
    ]);
    // χωρίς πλάτος ή με πλάτος έξω από τον καμβά δεν μπαίνει
    expect(parseFigureReply('S incline 10 15\nS incline 10 15 500')).toEqual([]);
  });
  it('ξέρει τα γράμματα κάθε σχήματος και τα γράφει στον κατάλογο', () => {
    expect(stampLetters('incline')).toEqual(['φ']);
    expect(stampLetters('block')).toEqual(['m']);
    const names = figureStampNames();
    expect(names).toContain('spring');
    expect(names).toContain('pendulum');
    // τα κρυφά (παλιά) σχήματα και τα εργαλεία του Δημοτικού δεν προτείνονται
    expect(names).not.toContain('resistor');
    expect(names.every((n) => !/^kid|clock|spell/.test(n))).toBe(true);
    const cat = figureCatalog();
    expect(cat).toContain('incline: ');
    expect(cat).toMatch(/spring: .*oscillates/);
  });
  it('οι τιμές πάνε στη θέση των γραμμάτων, και στις ταλαντώσεις γίνονται δεδομένα', () => {
    // σχήμα χωρίς τιμές (σε καμία έκδοση): η τιμή γράφεται στη θέση του γράμματος
    const pul = figureStamp({ k: 'stamp', name: 'pulley', x: 0, y: 0, w: 75, vals: [['m₁', '2 kg'], ['F', '10 N']] }, 100, 50, 200, '#000')!;
    expect(pul).toMatchObject({ kind: 'stamp', name: 'pulley', x: 100, y: 50, w: 200, h: 300, txt: { 'm₁': '2 kg' } });
    const sp = figureStamp({ k: 'stamp', name: 'spring', x: 0, y: 0, w: 70, vals: [['m', '0,2 kg'], ['k', '80 N/m'], ['A', '5 cm']] }, 0, 0, 380, '#000')!;
    expect(sp.sim).toEqual({ m: 0.2, k: 80, A: 0.05 });
    // το m του ελατηρίου μένει γράμμα: η τιμή φαίνεται στο πλαίσιο των τιμών
    expect(sp.txt).toBeUndefined();
    expect(figureStamp({ k: 'stamp', name: 'nothing', x: 0, y: 0, w: 10, vals: [] }, 0, 0, 10, '#000')).toBeNull();
    expect(figureStamp({ k: 'stamp', name: 'resistor', x: 0, y: 0, w: 10, vals: [] }, 0, 0, 10, '#000')).toBeNull();
  });
  it('σχήματα της beta: μόνο στη beta, και στο «Τι νέο» της beta', () => {
    // σήμερα: οι τιμές του ηλεκτρισμού, σε μία γραμμή
    expect(betaStampNews()).toHaveLength(1);
    expect(betaStampNews()[0]).toMatch(/\d+ σχήματα Φυσικής/);
    expect(betaStampNews()[0]).toContain('κυκλώματα');
    STAMPS.zzBeta = { ...STAMPS.incline, beta: true };
    STAMPS.zzSimBeta = { ...STAMPS.spring, sim: { ...STAMPS.spring.sim!, beta: true } };
    try {
      expect(figureStampNames(false)).not.toContain('zzBeta');
      expect(figureStampNames(true)).toContain('zzBeta');
      // το σχήμα υπάρχει και στην κανονική· μόνο οι τιμές του είναι της beta
      expect(figureStampNames(false)).toContain('zzSimBeta');
      expect(betaStampNews()[0]).toContain('δυνάμεις και κινήσεις');
    } finally {
      delete STAMPS.zzBeta;
      delete STAMPS.zzSimBeta;
    }
  });
});
