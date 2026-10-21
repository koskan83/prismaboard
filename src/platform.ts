/**
 * Πού τρέχει η εφαρμογή: πρόγραμμα Windows (Tauri, βλ. native.ts), εφαρμογή Android από το Google Play (Capacitor,
 * βλ. capacitor.config.ts και android/) ή browser. Στην εφαρμογή Android όλα τα αρχεία είναι μέσα στο πακέτο.
 */

import { isEn } from './i18n';

interface CapacitorGlobal {
  isNativePlatform?(): boolean;
  getPlatform?(): string;
}
// (στα tests του Node δεν υπάρχει window)
const cap = typeof window === 'undefined' ? undefined : (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;

/** Η εφαρμογή Android του Google Play. */
export const isAndroidApp = !!cap?.isNativePlatform?.() && cap.getPlatform?.() === 'android';

/**
 * Android (η εφαρμογή ή ο Chrome)· και στους μεγάλους διαδραστικούς πίνακες, όπου ο Chrome ζητά μόνος του «έκδοση για
 * υπολογιστές» και το userAgent λέει Linux αντί για Android: τότε το καταλαβαίνουμε από την αφή.
 */
export function isAndroid(): boolean {
  if (isAndroidApp) return true;
  const ua = navigator.userAgent;
  const platform = (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ?? '';
  return /Android/i.test(ua) || /Android/i.test(platform) || (/Linux/i.test(ua) && !/CrOS/i.test(ua) && navigator.maxTouchPoints > 0);
}

/** Ανοίγει μια σελίδα της εφαρμογής (οδηγίες, άδειες…): στην εφαρμογή Android στο ίδιο παράθυρο (πίσω με το ◁), αλλού σε νέα καρτέλα. */
export function openPage(url: string): void {
  // στα αγγλικά: η αγγλική σελίδα (odigies-en.html κ.λπ.)
  if (isEn) url = url.replace(/\/(odigies|adeies|dokimi)\.html/, '/$1-en.html');
  if (isAndroidApp) location.href = url;
  else window.open(url, '_blank');
}
