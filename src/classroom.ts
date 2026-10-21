/** Καθαρή λογική για τα εργαλεία τάξης (χρονόμετρο-πίτα, επίπεδο φωνής, μετρητής θορύβου): χωρίς DOM, για να δοκιμάζεται. */

const KEY_VOICE = 'grafida.voice';
const KEY_VIEW = 'grafida.timerView';
const KEY_LIMIT = 'grafida.noiseLimit';

const get = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const set = (k: string, v: string): void => {
  try { localStorage.setItem(k, v); } catch { /* χωρίς αποθήκευση */ }
};

/** Επίπεδο φωνής: 0 ησυχία, 1 ψίθυροι, 2 κανονική φωνή (ή null αν δεν έχει διαλεχτεί). */
export type VoiceLevel = 0 | 1 | 2;
export const loadVoice = (): VoiceLevel | null => {
  const v = get(KEY_VOICE);
  return v === '0' || v === '1' || v === '2' ? (Number(v) as VoiceLevel) : null;
};
export const saveVoice = (v: VoiceLevel): void => set(KEY_VOICE, String(v));

/** Προβολή χρονομέτρου: 0 ψηφία, 1 πίτα και ψηφία, 2 μόνο πίτα. */
export const loadView = (): number => {
  const v = Number(get(KEY_VIEW));
  return v === 1 || v === 2 ? v : 0;
};
export const saveView = (v: number): void => set(KEY_VIEW, String(v));

/** Όριο θορύβου που θυμάται ο μετρητής (0..100), αλλιώς null. */
export const loadLimit = (): number | null => {
  const v = get(KEY_LIMIT);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? clamp(n, 5, 95) : null;
};
export const saveLimit = (n: number): void => set(KEY_LIMIT, String(Math.round(n)));

export const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** Τιμή RMS (0..1) σε στάθμη 0..100: από −60 dB (ησυχία) ως −10 dB (δυνατός θόρυβος). */
export function rmsToLevel(rms: number): number {
  if (!(rms > 0)) return 0;
  return clamp(((20 * Math.log10(rms) + 60) / 50) * 100, 0, 100);
}

/** Εξομάλυνση: ανεβαίνει γρήγορα, πέφτει αργά. */
export const smooth = (prev: number, next: number): number => prev + (next - prev) * (next > prev ? 0.5 : 0.08);

/** Προεπιλεγμένο όριο θορύβου ανά επίπεδο φωνής: ησυχία χαμηλό, ψίθυροι μεσαίο, κανονική φωνή υψηλό. */
export const LIMITS: readonly number[] = [25, 45, 65];
export const DEFAULT_LIMIT = 55;
export const limitForVoice = (v: VoiceLevel | null): number => (v === null ? DEFAULT_LIMIT : LIMITS[v]!);

/** Ζώνη του μετρητή: 0 πράσινη, 1 κεχριμπαρί, 2 κόκκινη (πάνω από το όριο). */
export const zoneOf = (level: number, limit: number): 0 | 1 | 2 => (level >= limit ? 2 : level >= limit * 0.7 ? 1 : 0);

/** Πόσο από τον δίσκο μένει (0..1) όταν απομένουν ms από setMs. */
export const pieFraction = (ms: number, setMs: number): number => (setMs > 0 ? clamp(ms / setMs, 0, 1) : 0);

/** Σκέλος SVG για τομέα που ξεκινά από πάνω (12 η ώρα) και καλύπτει το frac του κύκλου, δεξιόστροφα. */
export function pieSector(frac: number, cx: number, cy: number, r: number): string {
  if (frac <= 0) return '';
  if (frac >= 0.9999) return `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx} ${cy + r}A${r} ${r} 0 1 1 ${cx} ${cy - r}Z`;
  const a = frac * Math.PI * 2;
  const x = cx + r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  return `M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${+x.toFixed(2)} ${+y.toFixed(2)}Z`;
}

/** Πόσες χαραγές έχει ο δίσκος: ένα ανά λεπτό (ως 60), αλλιώς 12 ίσα μέρη. */
export function pieTicks(setMs: number): number {
  const min = Math.round(setMs / 60_000);
  return min >= 1 && min <= 60 ? min : 12;
}

/** Χρώμα του τομέα: πορτοκαλί, κόκκινο όταν μένει λίγο. */
export const pieColor = (frac: number): string => (frac < 0.2 ? '#ef4444' : '#f97316');
