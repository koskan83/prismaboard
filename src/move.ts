/**
 * Μετακόμιση από την παλιά διεύθυνση (koskan83.github.io/prismaboard) στη νέα (prismaboard.klabs.gr).
 * Ο browser κρατά τα μαθήματα χωριστά για κάθε διεύθυνση, και ένα κρυφό πλαίσιο δεν βλέπει πια τα δεδομένα άλλου site.
 * Γι' αυτό η παλιά σελίδα ανοίγει τη νέα σε καρτέλα (με ένα πάτημα του χρήστη) και της στέλνει τα πάντα με postMessage:
 * τα μαθήματα και τις εικόνες τους, τα τμήματα, τα πρότυπα, τις λίστες λέξεων και τις ρυθμίσεις.
 * Τίποτα δεν περνά από διακομιστή· κάθε πλευρά δέχεται μηνύματα μόνο από την άλλη διεύθυνση.
 */
import { confirmBox, notice } from './dialog';
import { kvAll, kvPutMany } from './storage';
import { mergeMove, parse, type Meta } from './move-merge';

// στην ανάπτυξη: «παλιά» είναι η 127.0.0.1 και «νέα» η localhost, για να δοκιμάζεται η μεταφορά σε έναν υπολογιστή
const DEV = import.meta.env.DEV;
export const OLD_ORIGIN = DEV ? `http://127.0.0.1:${location.port}` : 'https://koskan83.github.io';
export const NEW_URL = DEV ? `http://localhost:${location.port}/` : 'https://prismaboard.klabs.gr/';
const NEW_ORIGIN = new URL(NEW_URL).origin;
const PARAM = 'metafora';
const MOVED = 'grafida.moved';
const DONE = 'prisma.moveDone';

/** true στην παλιά διεύθυνση, όπου η εφαρμογή προτείνει τη μεταφορά. */
export const isOldSite = location.origin === OLD_ORIGIN;
/** true όταν η νέα διεύθυνση άνοιξε από την παλιά για να πάρει τα δεδομένα. */
export const isMoveTarget = location.origin === NEW_ORIGIN && new URLSearchParams(location.search).has(PARAM) && !!window.opener;

interface Payload { type: 'prisma-move'; kv: [string, string][]; ls: [string, string][] }

/**
 * Παλιά διεύθυνση: σε κάθε άνοιγμα, πρόταση για μεταφορά. `flush`: αποθηκεύει πρώτα το ανοιχτό μάθημα.
 * `backup`: εφεδρικός δρόμος με αρχείο, όταν η νέα καρτέλα δεν απαντά (π.χ. εγκατεστημένη εφαρμογή σε Android
 * που ανοίγει τη νέα διεύθυνση χωρίς σύνδεση με την παλιά).
 */
export async function offerMove(flush: () => Promise<void>, backup: () => Promise<void>): Promise<void> {
  // η πρόταση φαίνεται μόνο όταν η νέα διεύθυνση απαντά (π.χ. όχι πριν στηθεί, ούτε χωρίς ίντερνετ)
  const up = await fetch(`${NEW_URL}precache.json`, { mode: 'no-cors', cache: 'no-store' }).then(() => true, () => false);
  if (!up) return;
  let moved = '';
  try { moved = localStorage.getItem(MOVED) ?? ''; } catch { /* χωρίς αποθήκευση */ }
  const host = new URL(NEW_URL).host;
  const go = await confirmBox(
    'Το PrismaBoard μετακόμισε',
    moved ? 'Άνοιγμα της νέας διεύθυνσης' : 'Μεταφορά των μαθημάτων',
    false,
    moved
      ? `Η νέα διεύθυνση είναι ${host}. Τα μαθήματα έχουν ήδη μεταφερθεί· ό,τι άλλαξες εδώ μετά θα περάσει κι αυτό με το κουμπί.`
      : `Η νέα διεύθυνση είναι ${host}. Πάτα το κουμπί: ανοίγει η νέα διεύθυνση και παίρνει μαζί όλα τα μαθήματα, τα τμήματα και τις ρυθμίσεις σου.`,
    'Αργότερα',
  );
  if (!go) return;
  // το παράθυρο ανοίγει αμέσως μετά το πάτημα, αλλιώς ο browser το μπλοκάρει
  const w = window.open(`${NEW_URL}?${PARAM}=1`, '_blank');
  if (!w) return void notice('Δεν άνοιξε η νέα διεύθυνση', [`Ο browser μπλόκαρε το νέο παράθυρο. Επίτρεψε τα αναδυόμενα παράθυρα για αυτή τη σελίδα και πάτα ξανά, ή άνοιξε το ${host}.`]);
  await flush().catch(() => undefined);
  let ready = false;
  setTimeout(() => {
    if (ready) return;
    window.removeEventListener('message', listen);
    void confirmBox('Η αυτόματη μεταφορά δεν ολοκληρώθηκε', 'Κατέβασμα σε αρχείο', false,
      `Κατέβασε τα μαθήματα σε αρχείο. Μετά, στο ${host}: κουμπί «Μαθήματα» (τα τετραγωνάκια πάνω αριστερά) → «Επαναφορά από αρχείο» και διάλεξε το αρχείο.`,
      'Κλείσιμο').then((ok) => { if (ok) void backup(); });
  }, 20000);
  const onMsg = async (e: MessageEvent): Promise<void> => {
    if (e.origin !== NEW_ORIGIN || e.source !== w) return;
    if (e.data?.type === 'prisma-ready') {
      ready = true;
      const ls: [string, string][] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)!;
          if (k.startsWith('grafida.') && k !== MOVED) ls.push([k, localStorage.getItem(k) ?? '']);
        }
      } catch { /* χωρίς αποθήκευση */ }
      const msg: Payload = { type: 'prisma-move', kv: await kvAll(), ls };
      w.postMessage(msg, NEW_ORIGIN);
    } else if (e.data?.type === 'prisma-moved') {
      window.removeEventListener('message', listen);
      try { localStorage.setItem(MOVED, new Date().toISOString()); } catch { /* χωρίς αποθήκευση */ }
    }
  };
  const listen = (e: MessageEvent): void => void onMsg(e);
  window.addEventListener('message', listen);
}

/** Νέα διεύθυνση: ζητά τα δεδομένα από την παλιά, τα ενώνει με όσα υπάρχουν και ξαναφορτώνει. */
export async function receiveMove(): Promise<void> {
  const opener = window.opener as Window;
  const data = await new Promise<Payload | null>((res) => {
    const t = setTimeout(() => res(null), 60000);
    window.addEventListener('message', function on(e: MessageEvent) {
      if (e.origin !== OLD_ORIGIN || e.source !== opener || e.data?.type !== 'prisma-move') return;
      clearTimeout(t);
      window.removeEventListener('message', on);
      res(e.data as Payload);
    });
    opener.postMessage({ type: 'prisma-ready' }, OLD_ORIGIN);
  });
  history.replaceState(null, '', location.pathname);
  if (!data || !Array.isArray(data.kv)) return void notice('Η μεταφορά δεν έγινε', ['Δεν ήρθαν δεδομένα από την παλιά διεύθυνση. Κλείσε αυτή την καρτέλα και πάτα ξανά «Μεταφορά» εκεί.']);
  const kv = data.kv.filter((e): e is [string, string] => Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'string');
  const have = new Map(await kvAll());
  // εδώ δεν υπήρχαν ακόμα μαθήματα: οι ρυθμίσεις της παλιάς διεύθυνσης παίρνουν τη θέση των αρχικών
  const fresh = !parse<Meta[]>(have.get('lessons'), []).length;
  const { put, lessons } = mergeMove(have, kv);
  await kvPutMany(put);
  try {
    for (const [k, v] of data.ls ?? []) {
      if (typeof k === 'string' && k.startsWith('grafida.') && typeof v === 'string' && (fresh || localStorage.getItem(k) === null)) localStorage.setItem(k, v);
    }
    sessionStorage.setItem(DONE, String(lessons));
  } catch { /* χωρίς αποθήκευση */ }
  opener.postMessage({ type: 'prisma-moved', lessons }, OLD_ORIGIN);
  // ξαναφόρτωση, ώστε η εφαρμογή να ξεκινήσει με όσα ήρθαν· το μήνυμα επιτυχίας φαίνεται μετά (movedNotice)
  location.replace(location.pathname);
}

/** Μετά τη μεταφορά και την ξαναφόρτωση: πόσα μαθήματα πέρασαν και τι κάνει ο χρήστης από εδώ και πέρα. */
export function movedNotice(): boolean {
  let n: string | null = null;
  try {
    n = sessionStorage.getItem(DONE);
    sessionStorage.removeItem(DONE);
  } catch { /* χωρίς αποθήκευση */ }
  if (n === null) return false;
  void notice('Η μεταφορά έγινε', [
    n === '1' ? 'Πέρασε 1 μάθημα.' : `Πέρασαν ${n} μαθήματα.`,
    'Από εδώ και πέρα άνοιγε αυτή τη διεύθυνση. Βάλ’ τη στους σελιδοδείκτες ή εγκατάστησέ τη ξανά ως εφαρμογή.',
  ]);
  return true;
}
