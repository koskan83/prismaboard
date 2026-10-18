/**
 * Σφάλματα που δεν τα έπιασε κανείς: αντί να χαθούν σιωπηλά στην κονσόλα, ένα μήνυμα λέει ότι κάτι δεν δούλεψε
 * και το κουμπί «Αναφορά» ανοίγει παράθυρο όπου ο χρήστης γράφει τι έκανε και πατά «Αποστολή».
 * Η αναφορά (έκδοση, browser, σφάλμα, ό,τι έγραψε) πηγαίνει με email στον δημιουργό μέσω του scripts/anafora.gs.
 * Δεν στέλνεται τίποτα αυτόματα, μόνο όταν πατηθεί «Αποστολή».
 */
import { askLines } from './dialog';
import { VERSION } from './news';

/** Η διεύθυνση /exec του scripts/anafora.gs· χωρίς αυτήν, η αναφορά ανοίγει ως θέμα στο GitHub. */
const REPORT_URL = 'https://script.google.com/macros/s/AKfycbxRXL7X9KAq1IMRiJ66lx7qKMqluTBDaVXFeKaZ_rnbXbKGac7ER4_uA_JV8oexKjPe/exec';
const ISSUES = 'https://github.com/koskan83/prismaboard/issues/new';
/** Θόρυβος του browser ή επεκτάσεων, όχι σφάλματα της εφαρμογής. */
const IGNORE = /ResizeObserver loop|^Script error\.?$|AbortError|The play\(\) request was interrupted/;

type Toast = (msg: string, ms?: number, action?: { label: string; run: () => void }) => void;

const recent: string[] = [];
let shown = 0, lastAt = 0;

/** Κείμενο της αναφοράς: η έκδοση, ο browser και τα τελευταία σφάλματα (χωρίς τίποτα από τα μαθήματα). */
export function errorReport(): string {
  return [`Έκδοση: ${VERSION}`, `Browser: ${navigator.userAgent}`, `Οθόνη: ${screen.width}×${screen.height} @${devicePixelRatio}`, '', ...recent].join('\n');
}

function describe(err: unknown, fallback: string): string {
  if (err instanceof Error) return `${err.name}: ${err.message}\n${(err.stack ?? '').split('\n').slice(1, 7).join('\n')}`;
  return String(err ?? fallback);
}

function report(text: string, toast: Toast): void {
  if (IGNORE.test(text)) return;
  recent.push(text.slice(0, 900));
  if (recent.length > 4) recent.shift();
  // το πολύ ένα μήνυμα το λεπτό και τρία σε κάθε άνοιγμα, ώστε ένα σφάλμα που επαναλαμβάνεται να μη γεμίσει την οθόνη
  if (shown >= 3 || Date.now() - lastAt < 60000) return;
  shown++;
  lastAt = Date.now();
  toast('Κάτι δεν δούλεψε σωστά. Αν το πρόβλημα συνεχίσει, ανανέωσε τη σελίδα.', 10000, {
    label: 'Αναφορά',
    run: () => void openReport(toast, recent[recent.length - 1].split('\n')[0]),
  });
}

/** Παράθυρο αναφοράς προβλήματος (από το μήνυμα σφάλματος ή από το μενού). */
export async function openReport(toast: Toast, title = 'Αναφορά από το μενού'): Promise<void> {
  const note = await askLines('Αναφορά προβλήματος', {
    hint: 'Γράψε τι έκανες πριν εμφανιστεί το πρόβλημα. Μαζί στέλνονται η έκδοση, ο browser και τα τεχνικά στοιχεία του σφάλματος, όχι τα μαθήματά σου.',
    ok: 'Αποστολή',
  });
  if (note === null) return;
  const details = errorReport();
  if (!REPORT_URL) {
    void navigator.clipboard?.writeText(details).catch(() => undefined);
    const body = `${note.trim() || 'Τι έκανα πριν εμφανιστεί:'}\n\n\`\`\`\n${details.slice(0, 3500)}\n\`\`\``;
    window.open(`${ISSUES}?title=${encodeURIComponent(`Σφάλμα: ${title.slice(0, 80)}`)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener');
    return;
  }
  try {
    // text/plain χωρίς ανάγνωση της απάντησης: το Apps Script δεν δέχεται τον έλεγχο CORS που θα έκανε ο browser για JSON
    await fetch(REPORT_URL, { method: 'POST', mode: 'no-cors', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ app: 'prismaboard', title, note: note.slice(0, 1500), details }) });
    toast('Η αναφορά στάλθηκε. Ευχαριστούμε!', 4000);
  } catch {
    void navigator.clipboard?.writeText(`${note}\n\n${details}`).catch(() => undefined);
    toast('Η αναφορά δεν στάλθηκε (ίσως δεν υπάρχει internet). Αντιγράφηκε στο πρόχειρο· δοκίμασε ξανά αργότερα.', 8000);
  }
}

/** Ξεκινά την παρακολούθηση. Σφάλματα από αρχεία άλλων (π.χ. επεκτάσεις του browser) αγνοούνται. */
export function catchErrors(toast: Toast): void {
  window.addEventListener('error', (e) => {
    if (e.filename && !e.filename.startsWith(location.origin)) return;
    report(describe(e.error, e.message), toast);
  });
  window.addEventListener('unhandledrejection', (e) => report(describe(e.reason, 'Promise χωρίς λόγο'), toast));
}
