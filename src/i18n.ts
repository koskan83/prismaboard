/**
 * Γλώσσα της εφαρμογής: ελληνικά ή αγγλικά. Κάθε κείμενο γράφεται στη θέση του και στις δύο γλώσσες,
 * `t('Αποθήκευση', 'Save')`, ώστε να μη χρειάζεται λεξικό με κλειδιά.
 * Η γλώσσα διαλέγεται από το μενού (αποθηκεύεται)· αλλιώς ελληνικά όταν η συσκευή είναι στα ελληνικά, αγγλικά σε κάθε άλλη.
 * Η αλλαγή γλώσσας ξαναφορτώνει τη σελίδα, γιατί πολλά κείμενα φτιάχνονται μία φορά στο άνοιγμα.
 * Περιεχόμενο που είναι από τη φύση του ελληνικό (λέξεις για ορθογραφία, συλλαβές) μένει ελληνικό.
 */

export type Lang = 'el' | 'en';

const KEY = 'grafida.lang';

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'el' || saved === 'en') return saved;
  } catch { /* χωρίς αποθήκευση */ }
  // στα tests του Node (χωρίς σελίδα): ελληνικά
  if (typeof document === 'undefined') return 'el';
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((l) => /^el\b/i.test(l ?? '')) ? 'el' : 'en';
}

export const lang: Lang = detect();
export const isEn = lang === 'en';

/** Το κείμενο στη γλώσσα της εφαρμογής. */
export function t(el: string, en: string): string {
  return isEn ? en : el;
}

/** Αλλάζει γλώσσα και ξαναφορτώνει. */
export function setLang(l: Lang): void {
  try { localStorage.setItem(KEY, l); } catch { /* χωρίς αποθήκευση */ }
  location.reload();
}

if (typeof document !== 'undefined') document.documentElement.lang = lang;

/** Για toLocaleString: δεκαδική υποδιαστολή στα ελληνικά (1,5), τελεία στα αγγλικά (1.5). */
export const locale = isEn ? 'en-US' : 'el';
