/**
 * Ο κατάλογος των εργαλείων του Δημοτικού που φορτώνονται αργότερα (βλ. lazy.ts): ό,τι χρειάζεται ο πίνακας πριν φτάσει ο κώδικάς τους.
 * Ένα test (tests/kids-catalog.test.ts) ελέγχει ότι συμφωνεί με τα ίδια τα εργαλεία· αν αλλάξει κάτι εκεί, αλλάζει κι εδώ.
 * `has`: ποιες προαιρετικές μέθοδοι υπάρχουν (tap, ask, paint, drop, fx, cursor, fullAt).
 */
import { t } from '../i18n';

export interface KidMeta { label: string; w: number; h: number; init?: number[]; big?: boolean; cheer?: boolean; animMs?: number; hidden?: boolean; has: string }

export const KID_CATALOG: Record<string, KidMeta> = {
  numline: { label: t('Αριθμογραμμή', 'Number line'), w: 760, h: 120, init: [0], has: 'tap' },
  clock: { label: t('Ρολόι', 'Clock'), w: 320, h: 390, init: [185, 1], has: 'tap paint drop' },
  blocks: { label: t('Εκατοντάδες, δεκάδες, μονάδες', 'Hundreds, tens, ones'), w: 620, h: 400, init: [234, 1], has: 'tap' },
  money: { label: t('Χρήματα', 'Money'), w: 640, h: 360, init: [1, 0, 0, 0, 0, 0, 0, 0, 0], has: 'tap' },
  hundred: { label: t('Πίνακας του 100', 'Hundred chart'), w: 500, h: 500, init: [0, 0, 0, 0], has: 'tap' },
  times: { label: t('Προπαίδεια', 'Times tables'), w: 520, h: 520, init: [0, 0, 0, 0], has: 'tap fx' },
  colops: { label: t('Κάθετη πράξη', 'Column sums'), w: 320, h: 300, has: '' },
  fracpie: { label: t('Κλάσμα: πίτα', 'Fraction: pie'), w: 280, h: 370, init: [4, 0], has: 'tap fx' },
  fracbar: { label: t('Κλάσμα: μπάρα', 'Fraction: bar'), w: 560, h: 170, init: [4, 0], has: 'tap fx' },
  fracpizza: { label: t('Κλάσμα: πίτσα', 'Fraction: pizza'), w: 280, h: 370, init: [4, 0, 1], has: 'tap fx' },
  fracchoc: { label: t('Κλάσμα: σοκολάτα', 'Fraction: chocolate'), w: 560, h: 170, init: [4, 0, 1], has: 'tap fx' },
  dice: { label: t('Ζάρι', 'Dice'), w: 150, h: 150, init: [5], has: 'tap fx' },
  lottery: { label: t('Κλήρωση', 'Draw names'), w: 240, h: 270, init: [0, 25], has: 'tap fx' },
  poll: { label: t('Ψηφοφορία', 'Vote'), w: 560, h: 380, init: [4, 0, 0, 0, 0, 0, 0], has: 'tap fx' },
  balance: { label: t('Ζυγαριά', 'Balance scale'), w: 660, h: 430, init: [1, 0], has: 'tap fx' },
  build: { label: t('Χτίσιμο με τουβλάκια', 'Building blocks'), w: 960, h: 640, init: [0], has: 'paint fx fullAt' },
  numcubes: { label: t('Κυβάκια και αριθμοί', 'Number cubes'), w: 960, h: 640, init: [0, 0, 0, 55, 130, 1, 1, 0, 0, 0, 100, 130, 2, 2, 0, 0, 0, 145, 130, 3, 3, 0, 0, 0, 190, 130, 4, 4, 0, 0, 0, 235, 130, 5, 5, 0, 0, 0], animMs: 2000, has: 'paint drop fx cursor fullAt' },
  spell: { label: t('Ορθογραφία', 'Spelling'), w: 900, h: 660, init: [0, 0], big: true, animMs: 16000, has: 'tap ask fx' },
  hangman: { label: t('Κρεμάλα', 'Hangman'), w: 800, h: 480, init: [0], has: 'tap ask fx' },
  syllables: { label: t('Συλλαβές', 'Syllables'), w: 960, h: 640, init: [0], big: true, animMs: 9000, has: 'tap ask paint drop fx' },
  'lab-circuit': { label: t('Κύκλωμα με λαμπάκια', 'Circuit with bulbs'), w: 960, h: 640, init: [2, 1, 0, 0, 0], big: true, animMs: 2500, has: 'tap fx' },
  'lab-sound': { label: t('Ήχος', 'Sound'), w: 960, h: 640, init: [2, 1, 0], big: true, animMs: 2500, has: 'tap fx' },
  'lab-light': { label: t('Φως και σκιές', 'Light and shadows'), w: 960, h: 640, init: [30, 0, 1], big: true, animMs: 2500, has: 'tap paint fx' },
  'lab-optics': { label: t('Ανάκλαση και διάθλαση', 'Reflection and refraction'), w: 960, h: 640, init: [0, 40], big: true, animMs: 2500, has: 'tap paint fx' },
  'lab-heat': { label: t('Θερμότητα: πάγος, νερό, ατμός', 'Heat: ice, water, steam'), w: 960, h: 640, init: [20, 0], big: true, animMs: 2500, has: 'tap fx' },
  'lab-magnet': { label: t('Μαγνήτης και πυξίδες', 'Magnet and compasses'), w: 960, h: 640, init: [50, 50, 0, 0, 0, 1], big: true, animMs: 2500, has: 'tap paint fx' },
};
