/** Έκδοση (ημερομηνία του build) και τα νέα της, για το «Τι νέο» μετά από ενημέρωση. */

import { BETA } from './beta';
import { t } from './i18n';
import { STAMPS } from './stamps';

declare const __BUILD__: string;
declare const __APP__: string;

export const VERSION: string = typeof __BUILD__ === 'string'
  ? `${typeof __APP__ === 'string' ? __APP__ : ''}${import.meta.env.VITE_CHANNEL === 'beta' ? ' beta' : ''} · ${__BUILD__}`.replace(/^ · /, '')
  : t('δοκιμαστική', 'test build');

/** Αλλάζει κάθε φορά που αλλάζει η λίστα: τότε το «Τι νέο» εμφανίζεται μία φορά σε κάθε συσκευή. */
export const NEWS_ID = BETA ? '2026-10-24-beta' : '2026-10-23';

/** Συνοπτικά, ανά θέμα: λίγες γραμμές που διαβάζονται με μια ματιά, αντί για κάθε αλλαγή χωριστά. */
/**
 * Στη beta: τα σχήματα (ή οι τιμές σχημάτων) που υπάρχουν μόνο εκεί, σε μία γραμμή, από τις σημαίες beta του STAMPS.
 * Όταν προστίθεται νέο, αλλάζει και το NEWS_ID, για να φανεί το «Τι νέο».
 */
export function betaStampNews(): string[] {
  const n = Object.values(STAMPS).filter((d) => !d.kid && !d.hidden && (d.beta || d.sim?.beta)).map((d) => d.label);
  return n.length ? [t(`Στη beta, σχήματα Φυσικής με τιμές και απαντήσεις: ${n.join(', ')}. Πάτα «Τιμές» ή πάνω στο πλαίσιο κάτω από το σχήμα.`, `In the beta, Physics drawings with values and answers: ${n.join(', ')}. Tap “Values” or the box under the drawing.`)] : [];
}

export const NEWS: string[] = [
  ...(BETA ? betaStampNews() : []),
  // μόνο στο beta: η κανονική έκδοση δεν έχει ακόμη αυτά τα εργαλεία
  ...(BETA ? [t('Στη δοκιμαστική έκδοση (beta): «Επίπεδο φωνής», «Μετρητής θορύβου» (ο ήχος δεν ηχογραφείται) και χρονόμετρο με δίσκο-πίτα. Στις ταλαντώσεις οι απαντήσεις κρατούν το π (T = 2π s, f = 1/(2π) ≈ 0,159 Hz), και το πλαίσιο των τιμών σέρνεται όπου θέλεις ή σβήνεται με το ✕.', 'In the beta: “Voice level”, a “Noise meter” (sound is never recorded) and a timer with a pie disk. In oscillations the answers keep π (T = 2π s, f = 1/(2π) ≈ 0.159 Hz), and the values box can be dragged anywhere or removed with ✕.')] : []),
  t('Κυβάκια και αριθμοί (Όργανα → Παιχνίδια): αριθμοί ως το 1000, οι τέσσερις πράξεις (+ − × :) με το 3 × 4 ως ορθογώνιο και το 12 : 3 σε καλάθια, ασκήσεις μόνες τους με το 🎲, και ζυγαριά με δύο πιατέλες για συγκρίσεις.', 'Number Cubes (Tools → Games): numbers up to 1000, all four operations (+ − × :) with 3 × 4 as a rectangle and 12 : 3 in baskets, exercises by themselves with 🎲, and a two-pan scale for comparisons.'),
  t('Παιχνίδια του Δημοτικού σε όλη την οθόνη: 🐸 Συλλαβές, Ορθογραφία με το τερατάκι 👾 και Κρεμάλα. Έτοιμες λέξεις ανά τάξη ή δικές σου σε λίστες (📋 Λέξεις), 10 λέξεις στην τύχη με το 🎲, και χρωματιστές κουκκίδες για το πώς τα πήγε το παιδί.', 'Primary games in full screen: 🐸 Syllables, Spelling with the little monster 👾 and Hangman. Ready-made words per grade or your own lists (📋 Words), 10 random words with 🎲, and colored dots showing how the child did.'),
  t('Δημοτικό: χαρούμενο θέμα με emoji, στρογγυλή γραμματοσειρά για παιδιά, Όργανα σε καρτέλες, η «Μέτρηση» στη μπάρα, ασκήσεις με το 🎯 (ρολόι, κλάσματα, προπαίδεια, ζυγαριά), κλάσματα ως πίτσα και σοκολάτα, Ε Δ Μ ως τις δεκάδες χιλιάδες, ήχοι και κομφετί.', 'Primary: a cheerful theme with emoji, a round font for children, Tools in tabs, “Measure” on the bar, 🎯 exercises (clock, fractions, times tables, scale), fractions as pizza and chocolate, place values up to ten thousands, sounds and confetti.'),
  t('Γραφή και σχήματα: ομορφότερη γραφή χωρίς ίντερνετ, «Τακτοποίηση» για τα χειρόγραφα, ίσια γραμμή με κράτημα που δείχνει τη γωνία της, γωνία ανάμεσα σε δύο γραμμές, μεγαλύτερο/μικρότερο, καθρέφτης, περιστροφή με όλο το χέρι και μετακίνηση σε άλλη σελίδα.', 'Writing and shapes: nicer handwriting with no internet, “Tidy up” for handwriting, straight lines by holding that show their angle, the angle between two lines, bigger/smaller, mirror, rotating with your whole hand and moving to another page.'),
  t('Φυσική: σχήματα σε κατηγορίες (τριβή, βολή, κυκλική κίνηση, κρούσεις, κύματα), που κινούνται με ▶· ελατήρια και εκκρεμές που ταλαντώνονται, γράμματα που αλλάζεις με δεύτερο πάτημα, και σχήμα από την εκφώνηση με το λάσο.', 'Physics: shapes in categories (friction, projectiles, circular motion, collisions, waves) that move with ▶; springs and a pendulum that oscillate, letters you change with a second tap, and a drawing from the problem text with the lasso.'),
  t('Αποθήκευση: ☰ → «Αποθήκευση…» και «Άνοιγμα…», στον δίσκο ή στο Google Drive, σε φάκελο για κάθε τμήμα. PDF και PNG με όποιες σελίδες διαλέξεις, περίγραμμα Α4 για εκτύπωση, QR για τους μαθητές, και υπενθύμιση για αντίγραφο κάθε εβδομάδα.', 'Saving: ☰ → “Save…” and “Open…”, on disk or Google Drive, in a folder for each class. PDF and PNG with the pages you choose, an A4 outline for printing, a QR for students, and a weekly backup reminder.'),
  t('Στην τάξη: ψηφοφορία με Α Β Γ Δ χωρίς κινητά, κλήρωση με ονόματα μαθητών, «Τι κάνουμε σήμερα;», ⭐ αγαπημένα όργανα στη μπάρα, έτοιμες σελίδες από το ＋ → Πρότυπα, και μεγαλύτερα γράμματα που διαβάζονται από τα θρανία.', 'In class: polls with A B C D and no phones, drawing students\' names, “What are we doing today?”, ⭐ favorite tools on the bar, ready-made pages from ＋ → Templates, and bigger letters that read well from the desks.'),
  t('Το PrismaBoard μιλά και αγγλικά (☰ → «English»). Στο Android και στα Windows: κανονικό παράθυρο, εικόνες και PDF από άλλες εφαρμογές με «Κοινοποίηση», ☰ → Έξοδος. Πρόβλημα ή πρόταση; ☰ → «Γράψε μας».', 'PrismaBoard speaks English too (☰ → “Ελληνικά” and back). On Android and Windows: a normal window, images and PDFs from other apps via “Share”, ☰ → Exit. Problem or idea? ☰ → “Write to us”.'),
];

const KEY = 'grafida.news';

/** true αν η συσκευή έχει ξαναχρησιμοποιήσει την εφαρμογή και δεν έχει δει αυτά τα νέα. Τα σημειώνει ως διαβασμένα. */
export function newsPending(returning: boolean): boolean {
  try {
    const seen = localStorage.getItem(KEY);
    localStorage.setItem(KEY, NEWS_ID);
    return returning && seen !== NEWS_ID;
  } catch {
    return false;
  }
}
