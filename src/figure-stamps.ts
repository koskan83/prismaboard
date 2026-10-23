/**
 * Τα έτοιμα σχήματα Φυσικής για το «Σχήμα από εκφώνηση»: το AI τα διαλέγει αντί να τα φτιάχνει από γραμμές,
 * και γράφει τις τιμές της άσκησης στη θέση των γραμμάτων τους (φ → 30°) ή, στις ταλαντώσεις, ως δεδομένα (m, k, A…).
 */

import type { FigCmd } from './ai';
import { StampItem, uid } from './model';
import { parseSim } from './osc-sim';
import { STAMPS } from './stamps';

/** Τα γράμματα που γράφει ένα σχήμα (φ, m, θ…), με τη σειρά που ζωγραφίζονται: όσα μπορεί να αλλάξει ο χρήστης (StampItem.txt). */
export function stampLetters(name: string): string[] {
  const d = STAMPS[name];
  if (!d) return [];
  const out: string[] = [];
  // καμβάς που δεν ζωγραφίζει τίποτα: κρατά μόνο ό,τι γράφεται με fillText
  const noop = (): void => {};
  const fake = new Proxy({} as Record<string | symbol, unknown>, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === 'fillText') return (s: string) => { if (s && !out.includes(s)) out.push(s); };
      if (k === 'measureText') return (s: string) => ({ width: s.length * 8 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop: noop });
      return noop;
    },
    set(o, k, v) {
      o[k] = v;
      return true;
    },
  });
  try {
    d.draw(fake as unknown as CanvasRenderingContext2D, d.w, d.h);
  } catch {
    // σχήμα που θέλει κάτι που δεν έχει ο ψεύτικος καμβάς: χωρίς γράμματα
  }
  return out;
}

/** Τα σχήματα που μπορεί να βάλει το AI: της Φυσικής, όσα φαίνονται στο μενού. */
export function figureStampNames(): string[] {
  return Object.entries(STAMPS).filter(([, d]) => d.cat && !d.hidden && !d.kid).map(([n]) => n);
}

/** Ο κατάλογος για την εντολή του AI, μία γραμμή ανά σχήμα: όνομα, τι είναι, αναλογίες και γράμματα. */
export function figureCatalog(): string {
  return figureStampNames().map((n) => {
    const d = STAMPS[n];
    const ls = stampLetters(n);
    return `${n}: ${d.label}, ${d.w}×${d.h}${d.spring ? ', oscillates (give its data)' : ''}${ls.length ? `, letters ${ls.join(' ')}` : ''}`;
  }).join('\n');
}

/**
 * Έτοιμο σχήμα από την απάντηση του AI, με πάνω αριστερή γωνία (x, y) και πλάτος w (μονάδες πίνακα)· null αν δεν υπάρχει τέτοιο σχήμα.
 * Στις ταλαντώσεις οι τιμές γίνονται δεδομένα (το πλαίσιο των τιμών και η πραγματική περίοδος)· στα άλλα γράφονται στη θέση των γραμμάτων.
 */
export function figureStamp(c: Extract<FigCmd, { k: 'stamp' }>, x: number, y: number, w: number, ink: string): StampItem | null {
  const d = STAMPS[c.name];
  if (!d || !figureStampNames().includes(c.name)) return null;
  const it: StampItem = { kind: 'stamp', id: uid(), name: c.name, x, y, w, h: (w * d.h) / d.w, color: ink, width: 3 };
  // ταλάντωση: ό,τι διαβάζεται ως δεδομένο (m, k, A, L…) πάει στο sim και το γράμμα του μένει όπως είναι
  const isData = (k: string, v: string): boolean => !!d.spring && Object.keys(parseSim(`${k} = ${v}`)).length > 0;
  if (d.spring) {
    const sim = parseSim(c.vals.map(([k, v]) => `${k} = ${v}`).join(', '));
    if (Object.keys(sim).length) it.sim = sim;
  }
  const letters = stampLetters(c.name);
  const txt: Record<string, string> = {};
  for (const [k, v] of c.vals) if (letters.includes(k) && v !== k && !isData(k, v)) txt[k] = v;
  if (Object.keys(txt).length) it.txt = txt;
  return it;
}
