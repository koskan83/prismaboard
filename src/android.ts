/**
 * Αρχεία στην εφαρμογή Android (Capacitor): μέσα σε WebView το «κατέβασμα» με a.download δεν κάνει τίποτα,
 * οπότε τα PDF και τα .json γράφονται στον φάκελο Έγγραφα/PrismaBoard της συσκευής, με κουμπί για κοινοποίηση
 * (Drive, email, Viber…). Τα plugins φορτώνονται μόνο εδώ, για να μη βαραίνουν τον browser.
 */

import { t } from './i18n';

type Toast = (msg: string, ms?: number, action?: { label: string; run: () => void }) => void;

async function base64(blob: Blob): Promise<string> {
  const url = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
  return url.slice(url.indexOf(',') + 1);
}

/**
 * Γράφει το αρχείο στα Έγγραφα/PrismaBoard (και στον υποφάκελο `sub`, π.χ. του τμήματος)· αν δεν γίνεται, στην προσωρινή
 * μνήμη της εφαρμογής (`docs`: false).
 */
export async function androidWrite(blob: Blob, name: string, temp = false, sub = ''): Promise<{ uri: string; docs: boolean }> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const data = await base64(blob);
  if (!temp) {
    try {
      const r = await Filesystem.writeFile({ path: `PrismaBoard/${sub ? `${sub}/` : ''}${name}`, data, directory: Directory.Documents, recursive: true });
      return { uri: r.uri, docs: true };
    } catch (err) {
      console.warn('Τα Έγγραφα δεν δέχτηκαν το αρχείο', err);
    }
  }
  const r = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
  return { uri: r.uri, docs: false };
}

export async function androidShareUri(uri: string, title: string): Promise<void> {
  const { Share } = await import('@capacitor/share');
  await Share.share({ title, files: [uri] });
}

/** «Αποθήκευση»: στα Έγγραφα/PrismaBoard, με «Κοινοποίηση» στο μήνυμα· αν δεν γράφεται εκεί, ανοίγει κατευθείαν η κοινοποίηση. */
export async function androidDownload(blob: Blob, name: string, toast: Toast): Promise<void> {
  try {
    const { uri, docs } = await androidWrite(blob, name);
    if (!docs) return await androidShareUri(uri, name);
    toast(t(`Αποθηκεύτηκε στα Έγγραφα/PrismaBoard: ${name}`, `Saved to Documents/PrismaBoard: ${name}`), 8000, { label: t('Κοινοποίηση', 'Share'), run: () => void androidShareUri(uri, name).catch(() => undefined) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : err;
    toast(t(`Αποτυχία αποθήκευσης: ${msg}`, `Couldn't save: ${msg}`), 6000);
  }
}

/** Κοινοποίηση ενός αρχείου (π.χ. το PDF του μαθήματος) χωρίς να μείνει αντίγραφο στα Έγγραφα. */
export async function androidShare(blob: Blob, name: string): Promise<void> {
  const { uri } = await androidWrite(blob, name, true);
  await androidShareUri(uri, name);
}

interface SpeechPlugin {
  speak(o: { text: string; lang: string; rate: number }): Promise<{ spoken: boolean; why?: string; engine?: string }>;
  stop(): Promise<void>;
}
// το plugin κρατιέται όπως είναι και όχι μέσα σε Promise: ο Proxy του Capacitor απαντά και στο `then`,
// οπότε ένα Promise που λύνεται με αυτόν περιμένει για πάντα (η φωνή δεν μιλούσε ποτέ, χωρίς μήνυμα)
let speech: SpeechPlugin | null = null;
let talking = 0;
/** Γιατί δεν ακούστηκε η τελευταία φράση (βλ. androidVoiceHelp). */
let lastWhy = '', lastEngine = '', lastMs = 0;

/** Ανάγνωση φωναχτά με τη φωνή της συσκευής (SpeechPlugin.java): το WebView δεν έχει speechSynthesis. false αν δεν έχει φωνή για τη γλώσσα. */
export async function androidSay(text: string, lang: string, rate: number): Promise<boolean> {
  talking++;
  const t0 = performance.now();
  // μηχανή φωνής που δεν απαντά ποτέ: μετά από αρκετή ώρα για να ειπωθεί το κείμενο, το θεωρούμε αποτυχία αντί να μένουμε σιωπηλοί
  let timer = 0;
  const late = new Promise<{ spoken: boolean; why: string }>((done) => {
    timer = window.setTimeout(() => done({ spoken: false, why: 'timeout' }), 6000 + text.length * 150);
  });
  try {
    if (!speech) {
      const { registerPlugin } = await import('@capacitor/core');
      speech = registerPlugin<SpeechPlugin>('Speech');
    }
    const r = await Promise.race([speech.speak({ text, lang, rate }), late]);
    lastWhy = r.spoken ? '' : r.why || 'nolang';
    if ('engine' in r && r.engine) lastEngine = r.engine;
    if (lastWhy === 'timeout') void androidStopSay();
    return r.spoken;
  } catch (e) {
    lastWhy = `plugin: ${String(e)}`;
    return false;
  } finally {
    clearTimeout(timer);
    lastMs = Math.round(performance.now() - t0);
    talking--;
  }
}

/** Τι απάντησε η φωνή της συσκευής στην τελευταία φράση, για δοκιμή στη beta: π.χ. «ok · com.google.android.tts · 840 ms». */
export const androidVoiceInfo = (): string => `${lastWhy || 'ok'} · ${lastEngine || '?'} · ${lastMs} ms`;

/** Μήνυμα για τον δάσκαλο όταν η androidSay γύρισε false: τι λείπει από τη συσκευή και πώς διορθώνεται. */
export function androidVoiceHelp(lang: string): string {
  const el = lang.startsWith('el');
  const tts = t('Ρυθμίσεις → Σύστημα → Γλώσσες → Μετατροπή κειμένου σε ομιλία', 'Settings → System → Languages → Text-to-speech');
  const eng = lastEngine ? ` (${lastEngine})` : '';
  switch (lastWhy) {
    case 'noengine': return t(`Η συσκευή δεν έχει φωνή για ανάγνωση. Βάλε από το Play τις «Υπηρεσίες ομιλίας από την Google» και διάλεξέ τες στο ${tts}.`,
      `This device has no text-to-speech voice. Install “Speech Services by Google” from Play and pick it in ${tts}.`);
    case 'nodata': return t(`Η φωνή της συσκευής${eng} δεν έχει κατεβάσει ${el ? 'ελληνικά' : 'αγγλικά'}: ${tts} → ⚙ → Εγκατάσταση δεδομένων φωνής.`,
      `The device voice${eng} has not downloaded ${el ? 'Greek' : 'English'}: ${tts} → ⚙ → Install voice data.`);
    case 'mute': return t('Η ένταση των πολυμέσων είναι στο μηδέν: ανέβασέ τη με τα κουμπιά έντασης του tablet.',
      'Media volume is at zero: turn it up with the tablet’s volume buttons.');
    case 'silent': return t(`Η φωνή της συσκευής${eng} είπε ότι τελείωσε χωρίς να ακουστεί τίποτα: συχνά τα ${el ? 'ελληνικά' : 'αγγλικά'} της είναι μόνο από το δίκτυο. ${tts} → ⚙ → Εγκατάσταση δεδομένων φωνής, και κατέβασε τα ${el ? 'ελληνικά' : 'αγγλικά'} στη συσκευή.`,
      `The device voice${eng} reported done without playing anything: often its ${el ? 'Greek' : 'English'} is network-only. ${tts} → ⚙ → Install voice data, and download ${el ? 'Greek' : 'English'} to the device.`);
    case 'timeout': return t(`Η φωνή της συσκευής${eng} δεν απάντησε. Δοκίμασε την «Αναπαραγωγή» στο ${tts}, ή διάλεξε τις «Υπηρεσίες ομιλίας από την Google».`,
      `The device voice${eng} did not respond. Try “Play” in ${tts}, or pick “Speech Services by Google”.`);
    case 'nolang': case '': return t(`Η φωνή της συσκευής${eng} δεν έχει ${el ? 'ελληνικά' : 'αγγλικά'}. Βάλε τα από το ${tts}.`,
      `The device voice${eng} has no ${el ? 'Greek' : 'English'}. Add it in ${tts}.`);
    default: return t(`Η φωνή της συσκευής${eng} δεν μίλησε (${lastWhy}). Δοκίμασέ τη στο ${tts}.`,
      `The device voice${eng} did not speak (${lastWhy}). Test it in ${tts}.`);
  }
}

export const androidSpeaking = (): boolean => talking > 0;

export async function androidStopSay(): Promise<void> {
  if (speech) await speech.stop().catch(() => undefined);
}
