/** Η ένωση των δεδομένων στη μετακόμιση σε νέα διεύθυνση (βλ. move.ts)· χωρίς browser, για να ελέγχεται με τεστ. */

export interface Meta { id: string; updated: number }

export const parse = <T>(s: string | undefined, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Τι γράφεται στη νέα διεύθυνση, με βάση ό,τι υπάρχει ήδη εκεί (`have`) και ό,τι ήρθε (`got`).
 * Μαθήματα: όσα λείπουν ή είναι νεότερα στην παλιά, μαζί με τις εικόνες τους. Τμήματα: ενώνονται.
 * Όλα τα άλλα (πρότυπα, λίστες, …): μόνο αν δεν υπάρχουν ήδη. Επιστρέφει και πόσα μαθήματα πέρασαν.
 */
export function mergeMove(have: Map<string, string>, got: [string, string][]): { put: [string, string][]; lessons: number } {
  const g = new Map(got);
  const put: [string, string][] = [];
  const mine = parse<Meta[]>(have.get('lessons'), []);
  const theirs = parse<Meta[]>(g.get('lessons'), []);
  const take = new Set<string>();
  const index = [...mine];
  for (const m of theirs) {
    if (!m || typeof m.id !== 'string') continue;
    const i = index.findIndex((x) => x.id === m.id);
    if (i < 0) index.push(m);
    else if ((m.updated ?? 0) > (index[i].updated ?? 0)) index[i] = m;
    else continue;
    take.add(m.id);
  }
  if (take.size) put.push(['lessons', JSON.stringify(index)]);
  const rosters = { ...parse<Record<string, string[]>>(g.get('rosters'), {}), ...parse<Record<string, string[]>>(have.get('rosters'), {}) };
  if (g.has('rosters')) put.push(['rosters', JSON.stringify(rosters)]);
  for (const [k, v] of got) {
    if (k === 'lessons' || k === 'rosters') continue;
    const lesson = /^(?:lesson|img):([^:]+)/.exec(k);
    if (lesson ? take.has(lesson[1]) : !have.has(k)) put.push([k, v]);
  }
  return { put, lessons: take.size };
}

