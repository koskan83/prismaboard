import { afterEach, describe, expect, it } from 'vitest';
import { hangState, KIDS, spellState } from '../src/kids';
import { READY_LISTS, readyWords, setReadyCustom } from '../src/kids/ready-words';
import { sylState } from '../src/kids/syllables';

describe('έτοιμες λέξεις των παιχνιδιών', () => {
  afterEach(() => setReadyCustom({}));

  it('χωρίς αλλαγές οι αρχικές· με αλλαγές οι δικές σου· άδεια λίστα δεν μένει ποτέ', () => {
    expect(READY_LISTS.map((l) => l.id)).toEqual(['syllables', 'hangman', ...[0, 1, 2, 3, 4, 5].map((k) => `spell-el-${k}`), ...[0, 1, 2, 3, 4, 5].map((k) => `spell-en-${k}`)]);
    expect(readyWords('syllables')).toContain('βάτραχος');
    setReadyCustom({ syllables: ['κότα'], hangman: [] });
    expect(readyWords('syllables')).toEqual(['κότα']);
    expect(readyWords('hangman')).toContain('ΣΧΟΛΕΙΟ');
  });

  it('το 🎲 των παιχνιδιών παίρνει από τη λίστα του δασκάλου', () => {
    setReadyCustom({ syllables: ['κό-τα'], hangman: ['ΠΑΠΙΑ'], 'spell-el-0': ['ένα', 'δύο'] });
    const syl = KIDS.syllables, hang = KIDS.hangman, spell = KIDS.spell;
    expect(sylState(syl.tap!(syl.init!, syl.w * 0.1, syl.h * 0.93, syl.w, syl.h)!).letters.join('')).toBe('κότα');
    expect(hangState(hang.tap!(hang.init!, hang.w * 0.45, hang.h * 0.9, hang.w, hang.h)!).word).toBe('ΠΑΠΙΑ');
    // Ορθογραφία: Α΄ τάξη, όσες λέξεις έχει η λίστα (λιγότερες από 8)
    expect(spellState(spell.tap!(spell.init!, spell.w * 0.12, spell.h * 0.57, spell.w, spell.h)!).words.sort()).toEqual(['δύο', 'ένα'].sort());
  });
});
