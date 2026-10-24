/**
 * Τα κουμπιά ενός επιλεγμένου σχήματος στη δεύτερη σειρά της μπάρας: ποια φαίνονται και με ποια σειρά.
 * Κάθε σχήμα έχει ρητή λίστα (StampDef.opts, ή η προεπιλογή από το είδος του), για να μη γεμίζει η μπάρα
 * με κουμπιά που δεν του ταιριάζουν. Ό,τι σπάνιο πάει στο παράθυρο «Τιμές», όχι σε νέο κουμπί.
 */

import { BETA } from './beta';
import { stampSim } from './sim-def';
import { STAMPS } from './stamps';

export type OptId = 'play' | 'sim' | 'marks' | 'damp' | 'stop' | 'pos' | 'pin' | 'copy';

/** Η σταθερή σειρά: ▶ → Τιμές → ό,τι αλλάζει την εμφάνιση ή τη θέση. */
export const OPT_ORDER: OptId[] = ['play', 'sim', 'marks', 'damp', 'stop', 'pos', 'pin', 'copy'];

/** Το κουμπί κάθε επιλογής (id στο ui.ts)· τα beta υπάρχουν στη σελίδα μόνο στη δοκιμαστική έκδοση. */
export const OPTS: Record<OptId, { el: string; beta?: boolean }> = {
  play: { el: 'spPlay' },
  sim: { el: 'spSim', beta: true },
  marks: { el: 'spMarks' },
  damp: { el: 'spDamp' },
  stop: { el: 'spStop' },
  pos: { el: 'spPos', beta: true },
  pin: { el: 'spPin', beta: true },
  copy: { el: 'spCopy', beta: true },
};

/** Πόσα δικά του κουμπιά έχει το πολύ ένα σχήμα (μαζί με τα 5 κοινά της επιλογής: 10). */
export const MAX_OPTS = 5;
/** Τα ελατήρια και το εκκρεμές έχουν ήδη 7 στη beta· μένουν εξαίρεση ώσπου να αποφασιστεί ποια πάνε στο «Τιμές». */
export const OVER_LIMIT = new Set(['spring', 'springV', 'springIncline', 'pendulum']);

/** Τα κουμπιά του σχήματος `name`, με τη σειρά τους· κενό για σχήματα χωρίς δικές τους επιλογές. */
export function stampOpts(name: string, beta = BETA): OptId[] {
  const d = Object.prototype.hasOwnProperty.call(STAMPS, name) ? STAMPS[name] : undefined;
  if (!d || d.kid) return [];
  // προεπιλογή: τα σχήματα με κίνηση μόνο ▶, τα ελατήρια θέσεις, απόσβεση, στοπ (και στη beta θέση, 📌, στοίχιση)
  const set = new Set<OptId>(d.opts ?? [...(d.play ? ['play' as const] : []), ...(d.spring ? (['marks', 'damp', 'stop', 'pos', 'pin', 'copy'] as const) : [])]);
  if (stampSim(name, beta)) set.add('sim');
  return OPT_ORDER.filter((o) => set.has(o) && (!OPTS[o].beta || beta));
}
