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
  speak(o: { text: string; lang: string; rate: number }): Promise<{ spoken: boolean }>;
  stop(): Promise<void>;
}
let speech: Promise<SpeechPlugin> | null = null;
let talking = 0;

/** Ανάγνωση φωναχτά με τη φωνή της συσκευής (SpeechPlugin.java): το WebView δεν έχει speechSynthesis. false αν δεν έχει φωνή για τη γλώσσα. */
export async function androidSay(text: string, lang: string, rate: number): Promise<boolean> {
  speech ??= import('@capacitor/core').then(({ registerPlugin }) => registerPlugin<SpeechPlugin>('Speech'));
  talking++;
  try {
    return (await (await speech).speak({ text, lang, rate })).spoken;
  } catch {
    return false;
  } finally {
    talking--;
  }
}

export const androidSpeaking = (): boolean => talking > 0;

export async function androidStopSay(): Promise<void> {
  if (speech) await (await speech).stop().catch(() => undefined);
}
