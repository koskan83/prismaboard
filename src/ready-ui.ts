/**
 * Οι έτοιμες λέξεις των παιχνιδιών (kids/ready-words.ts): φορτώνονται από τη συσκευή στην αρχή, και το «📋 Λέξεις» της
 * πλήρους οθόνης τις δείχνει και τις αλλάζει. Φυλάγονται μόνο οι λίστες που άλλαξαν· οι άλλες μένουν όπως έρχονται.
 */
import { editReady, type ReadyEdit } from './dialog';
import { t } from './i18n';
import { READY_LISTS, readyCustom, readyWords, setReadyCustom } from './kids/ready-words';
import { spellList } from './kids/spell-words';
import { kvGet, kvSet } from './storage';
import { syllables } from './syllabify';

const KEY = 'readyWords';

/** Οι αλλαγές του δασκάλου, από τη συσκευή· ό,τι δεν είναι λίστα λέξεων αγνοείται. */
export async function loadReady(): Promise<void> {
  const got = await kvGet<Record<string, unknown>>(KEY);
  const out: Record<string, string[]> = {};
  for (const [id, words] of Object.entries(got ?? {})) {
    if (Array.isArray(words) && READY_LISTS.some((l) => l.id === id)) out[id] = words.filter((w): w is string => typeof w === 'string' && !!w.trim());
  }
  setReadyCustom(out);
}

const split = (text: string): string[] => text.split(/[,;\n]+/).map((w) => w.trim()).filter(Boolean);

/** Κρεμάλα: κεφαλαία χωρίς τόνους, από 2 έως 16 γράμματα (όπως το hangNorm). */
function parseHang(text: string): { ok: string[]; bad: string[] } {
  const ok: string[] = [], bad: string[] = [];
  for (const w of split(text)) {
    const n = w.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ');
    if (/^[Α-Ω ]+$/.test(n) && n.replace(/ /g, '').length >= 2 && n.length <= 16) ok.push(n);
    else bad.push(w);
  }
  return { ok, bad };
}

/** Συλλαβές: μία ελληνική λέξη, ως 14 γράμματα και ως 7 συλλαβές (με παύλες, ο χωρισμός που θέλεις). */
function parseSyl(text: string): { ok: string[]; bad: string[] } {
  const ok: string[] = [], bad: string[] = [];
  for (const w of split(text)) {
    const word = w.toLowerCase(), plain = word.replace(/-/g, '');
    const parts = word.includes('-') ? word.split('-').filter(Boolean) : syllables(plain);
    if (/^[α-ωάέήίόύώϊϋΐΰς-]+$/.test(word) && plain.length >= 2 && plain.length <= 14 && parts.length <= 7) ok.push(word);
    else bad.push(w);
  }
  return { ok, bad };
}

/** Ορθογραφία: όπως στις λίστες της (spellList), οι αγγλικές με τη σημασία τους (apple = μήλο). */
function parseSpell(text: string): { ok: string[]; bad: string[] } {
  const l = spellList(text);
  return { ok: l.words.map((w, i) => (l.hints[i] ? `${w}=${l.hints[i]}` : w)), bad: [] };
}

const HINTS: Record<string, string> = {
  syllables: t('Οι λέξεις του 🎲 Νέα λέξη. Με παύλες ορίζεις εσύ τον χωρισμό (βι-βλι-ο-θή-κη).', 'The words for 🎲 New word (Greek). Use dashes to set the split yourself (βι-βλι-ο-θή-κη).'),
  hangman: t('Οι λέξεις του 🎲 Νέα λέξη· γράφονται χωρίς τόνους, με κεφαλαία.', 'The words for 🎲 New word (Greek); written in capitals, without accents.'),
  spell: t('Οι έτοιμες λέξεις κάθε τάξης· κάθε παιχνίδι παίρνει 8 στην τύχη. Στα Αγγλικά γράψε και τη σημασία: apple = μήλο.', 'The ready words for each grade; each game picks 8 at random. For English words, add the meaning too: apple = (meaning).'),
};

/** Το παράθυρο με τις έτοιμες λέξεις ενός παιχνιδιού (Συλλαβές, Κρεμάλα, Ορθογραφία). */
export function openReady(game: string): Promise<void> {
  const lists = READY_LISTS.filter((l) => l.game === game);
  if (!lists.length) return Promise.resolve();
  const edit = (id: string): ReadyEdit => ({ id, name: lists.find((l) => l.id === id)!.name, words: readyWords(id), custom: !!readyCustom()[id] });
  return editReady({
    title: `${t('Έτοιμες λέξεις', 'Ready words')}: ${game === 'spell' ? t('Ορθογραφία', 'Spelling') : lists[0].name}`,
    hint: HINTS[game],
    lists: lists.map((l) => edit(l.id)),
    parse: game === 'hangman' ? parseHang : game === 'syllables' ? parseSyl : parseSpell,
    show: (w) => w.replace('=', ' = '),
    async save(id, words) {
      const next = { ...readyCustom() };
      const orig = lists.find((l) => l.id === id)!.words;
      // ίδιες με τις αρχικές: δεν φυλάγονται, για να έρχονται και οι νέες λέξεις μιας ενημέρωσης
      if (!words || words.join('\n') === orig.join('\n')) delete next[id];
      else next[id] = words;
      setReadyCustom(next);
      await kvSet(KEY, next);
      return edit(id);
    },
  });
}
