/**
 * Μεγάλα παράθυρα ερώτησης της ίδιας της εφαρμογής, αντί για τα μικρά `prompt` / `confirm` του browser:
 * διαβάζονται από μακριά, πατιούνται με το δάχτυλο και δεν βγάζουν τον πίνακα από την πλήρη οθόνη.
 */

import { t } from './i18n';

export interface AskOptions {
  /** Αρχική τιμή του πεδίου. */
  value?: string;
  /** Μικρή επεξήγηση κάτω από τον τίτλο. */
  hint?: string;
  /** Ό,τι γράφεται φαίνεται ως κουκκίδες (π.χ. η λέξη της κρεμάλας). */
  secret?: boolean;
  max?: number;
  /** Υπαγόρευση: 🎤 δίπλα στο πεδίο, που προσθέτει ό,τι πει ο χρήστης σε αυτή τη γλώσσα (π.χ. 'el-GR'), χωρισμένο με κόμμα από τα προηγούμενα. */
  voice?: string;
  /** Έτοιμες τιμές που μπαίνουν με ένα πάτημα. */
  picks?: string[];
  ok?: string;
}

let open: (() => void) | null = null;

/** Όσα χρειαζόμαστε από την αναγνώριση ομιλίας του browser (υπάρχει σε Chrome και Edge). */
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function shell(title: string, hint: string | undefined): { back: HTMLDivElement; box: HTMLDivElement } {
  open?.();
  const back = document.createElement('div');
  back.id = 'ask';
  const box = document.createElement('div');
  box.className = 'askBox';
  const b = document.createElement('b');
  b.textContent = title;
  box.append(b);
  if (hint) {
    const s = document.createElement('small');
    s.textContent = hint;
    box.append(s);
  }
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', title);
  // με το πληκτρολόγιο το Tab μένει μέσα στο παράθυρο, δεν φεύγει στον πίνακα από πίσω
  back.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...box.querySelectorAll<HTMLElement>('button, input, textarea, select, [tabindex]')].filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], at = document.activeElement;
    if (!box.contains(at) || (e.shiftKey && at === first) || (!e.shiftKey && at === last)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  });
  back.append(box);
  document.body.append(back);
  return { back, box };
}

function button(label: string, cls: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = label;
  b.className = cls;
  return b;
}

interface Mic { btn: HTMLButtonElement; note: HTMLElement; abort(): void }

/** Κουμπί 🎤 για υπαγόρευση: κάθε φορά που μιλά ο χρήστης, το `add` παίρνει ό,τι είπε και λέει πόσα έχουν μπει ως τώρα. */
function micButton(lang: string, add: (said: string) => number): Mic {
  let rec: SpeechRec | null = null;
  const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec });
  const Rec = SR.SpeechRecognition ?? SR.webkitSpeechRecognition;
  const btn = button('🎤', 'eye mic'), note = document.createElement('small');
  btn.title = t('Πες τη λέξη ή την πρόταση', 'Say the word or sentence');
  btn.onclick = () => {
    if (rec) return rec.stop();
    if (!Rec) {
      note.textContent = t('Η υπαγόρευση δεν υποστηρίζεται εδώ: θέλει Chrome ή Edge και ίντερνετ. Γράψε τις λέξεις με το πληκτρολόγιο.', 'Dictation is not supported here: it needs Chrome or Edge and an internet connection. Type the words with the keyboard.');
      return;
    }
    const r = (rec = new Rec());
    r.lang = lang;
    r.interimResults = false;
    r.onresult = (e) => {
      const said = e.results[e.results.length - 1][0].transcript.replace(/[,;.!?·]/g, ' ').replace(/ +/g, ' ').trim();
      if (said) {
        const n = add(said);
        note.textContent = t(`Μπήκε (${n}). Πάτα ξανά το 🎤 για την επόμενη.`, `Added (${n}). Tap 🎤 again for the next one.`);
      }
    };
    r.onerror = (e) => {
      note.textContent = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? t('Δεν δόθηκε άδεια για το μικρόφωνο.', 'Microphone permission was not granted.') : e.error === 'no-speech' ? t('Δεν άκουσα τίποτα. Πάτα το 🎤 και ξαναπές το.', "I didn't hear anything. Tap 🎤 and say it again.") : t('Η υπαγόρευση δεν δούλεψε (θέλει ίντερνετ). Γράψε τις λέξεις με το πληκτρολόγιο.', "Dictation didn't work (it needs an internet connection). Type the words with the keyboard.");
    };
    r.onend = () => {
      rec = null;
      btn.classList.remove('on');
    };
    note.textContent = t('Ακούω… πες τη λέξη ή την πρόταση.', 'Listening… say the word or sentence.');
    btn.classList.add('on');
    try { r.start(); } catch { rec = null; btn.classList.remove('on'); }
  };
  return { btn, note, abort: () => rec?.abort() };
}

/** Ζητά ένα κείμενο. null αν ο χρήστης το ακύρωσε. */
export function ask(title: string, o: AskOptions = {}): Promise<string | null> {
  return new Promise((res) => {
    const { back, box } = shell(title, o.hint);
    const row = document.createElement('div');
    row.className = 'askIn';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = o.value ?? '';
    inp.maxLength = o.max ?? 60;
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.enterKeyHint = 'done';
    row.append(inp);
    if (o.secret) {
      inp.classList.add('secret');
      const eye = button('👁', 'eye');
      eye.title = t('Εμφάνιση / απόκρυψη', 'Show / hide');
      eye.onclick = () => {
        inp.classList.toggle('secret');
        inp.focus();
      };
      row.append(eye);
    }
    box.append(row);
    let mic: Mic | null = null;
    if (o.voice) {
      mic = micButton(o.voice, (said) => {
        inp.value = (inp.value.trim() ? `${inp.value.trim().replace(/,$/, '')}, ${said}` : said).slice(0, inp.maxLength);
        return inp.value.split(',').length;
      });
      row.append(mic.btn);
      box.append(mic.note);
    }
    if (o.picks?.length) {
      const picks = document.createElement('div');
      picks.className = 'askPicks';
      for (const p of o.picks) {
        const b = button(p, '');
        b.onclick = () => {
          inp.value = p;
          inp.focus();
        };
        picks.append(b);
      }
      box.append(picks);
    }
    const acts = document.createElement('div');
    acts.className = 'askActs';
    const no = button(t('Άκυρο', 'Cancel'), 'no'), yes = button(o.ok ?? t('Εντάξει', 'OK'), 'go');
    acts.append(no, yes);
    box.append(acts);
    const done = (v: string | null): void => {
      if (open !== cancel) return;
      open = null;
      mic?.abort();
      back.remove();
      res(v);
    };
    const cancel = (): void => done(null);
    open = cancel;
    no.onclick = cancel;
    yes.onclick = () => done(inp.value);
    back.addEventListener('pointerdown', (e) => {
      if (e.target === back) cancel();
    });
    inp.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') done(inp.value);
      else if (e.key === 'Escape') cancel();
    });
    inp.focus();
    inp.select();
  });
}

/** Ζητά κείμενο πολλών γραμμών (π.χ. τα ονόματα ενός τμήματος, ένα σε κάθε γραμμή). null αν ακυρώθηκε. */
export function askLines(title: string, o: { value?: string; hint?: string; ok?: string } = {}): Promise<string | null> {
  return new Promise((res) => {
    const { back, box } = shell(title, o.hint);
    const ta = document.createElement('textarea');
    ta.className = 'askText';
    ta.value = o.value ?? '';
    ta.spellcheck = false;
    ta.rows = 10;
    const acts = document.createElement('div');
    acts.className = 'askActs';
    const no = button(t('Άκυρο', 'Cancel'), 'no'), yes = button(o.ok ?? t('Εντάξει', 'OK'), 'go');
    acts.append(no, yes);
    box.append(ta, acts);
    const done = (v: string | null): void => {
      if (open !== cancel) return;
      open = null;
      back.remove();
      res(v);
    };
    const cancel = (): void => done(null);
    open = cancel;
    no.onclick = cancel;
    yes.onclick = () => done(ta.value);
    ta.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') cancel();
    });
    ta.focus();
  });
}

/** Ζητά επιβεβαίωση. `danger`: το κουμπί της ενέργειας γίνεται κόκκινο (διαγραφές). */
export function confirmBox(title: string, ok = t('Ναι', 'Yes'), danger = false, hint?: string, noLabel = t('Άκυρο', 'Cancel')): Promise<boolean> {
  return new Promise((res) => {
    const { back, box } = shell(title, hint);
    const acts = document.createElement('div');
    acts.className = 'askActs';
    const no = button(noLabel, 'no'), yes = button(ok, danger ? 'go danger' : 'go');
    acts.append(no, yes);
    box.append(acts);
    const done = (v: boolean): void => {
      if (open !== cancel) return;
      open = null;
      removeEventListener('keydown', key, true);
      back.remove();
      res(v);
    };
    const cancel = (): void => done(false);
    const key = (e: KeyboardEvent): void => {
      e.stopPropagation();
      if (e.key === 'Enter') done(true);
      else if (e.key === 'Escape') cancel();
    };
    open = cancel;
    addEventListener('keydown', key, true);
    no.onclick = cancel;
    yes.onclick = () => done(true);
    back.addEventListener('pointerdown', (e) => {
      if (e.target === back) cancel();
    });
    yes.focus();
  });
}

/** Ενημερωτικό παράθυρο με λίστα (π.χ. «Τι νέο»). */
export interface NoticeOptions {
  hint?: string;
  /** Γραμμές που φαίνονται μόνο με το κουμπί `moreLabel`. */
  more?: string[];
  moreLabel?: string;
  /** Ένα ακόμα κουμπί (π.χ. λήψη σε αρχείο)· δεν κλείνει το παράθυρο. */
  extra?: { label: string; run: () => void };
}

export function notice(title: string, lines: string[], o: NoticeOptions = {}): Promise<void> {
  const { hint, more = [], moreLabel = t('Παλιότερα', 'Older'), extra } = o;
  return new Promise((res) => {
    const { back, box } = shell(title, hint);
    const ul = document.createElement('ul');
    const add = (ls: string[]): void => {
      for (const l of ls) {
        const li = document.createElement('li');
        li.textContent = l;
        ul.append(li);
      }
    };
    add(lines);
    const acts = document.createElement('div');
    acts.className = 'askActs';
    const yes = button(t('Εντάξει', 'OK'), 'go');
    // τα παλιότερα μένουν κρυμμένα πίσω από ένα κουμπί, για να διαβάζονται τα καινούρια με μια ματιά
    if (more.length) {
      const old = button(`${moreLabel} (${more.length})`, '');
      old.onclick = () => {
        add(more);
        old.remove();
        ul.lastElementChild?.scrollIntoView({ block: 'nearest' });
      };
      acts.append(old);
    }
    if (extra) {
      const b = button(extra.label, '');
      b.onclick = extra.run;
      acts.append(b);
    }
    acts.append(yes);
    box.append(ul, acts);
    const done = (): void => {
      if (open !== done) return;
      open = null;
      back.remove();
      res();
    };
    open = done;
    yes.onclick = done;
    back.addEventListener('pointerdown', (e) => {
      if (e.target === back) done();
    });
  });
}

/** Μια γραμμή του `chooseBox`. */
export interface Choice {
  key: string;
  title: string;
  /** Μικρή γραμμή κάτω από τον τίτλο (π.χ. ημερομηνία). */
  sub?: string;
  /** Ετικέτα δεξιά (π.χ. «νέο»)· `badgeGo`: τονισμένη. */
  badge?: string;
  badgeGo?: boolean;
  /** Επικεφαλίδα ενότητας: οι γραμμές με την ίδια μπαίνουν μαζί, με τη σειρά που έρχονται. */
  section?: string;
}

/**
 * Διάλεξε ένα από μια λίστα (π.χ. μάθημα από το Drive). Επιστρέφει το `key` της γραμμής ή ενός από τα κουμπιά `extra`,
 * ή null αν ακυρώθηκε.
 */
export function chooseBox(title: string, items: Choice[], o: { hint?: string; empty?: string; extra?: { key: string; label: string }[] } = {}): Promise<string | null> {
  return new Promise((res) => {
    const { back, box } = shell(title, o.hint);
    const list = document.createElement('div');
    list.className = 'chooseList';
    let section: string | undefined;
    for (const it of items) {
      if (it.section !== undefined && it.section !== section) {
        section = it.section;
        const h = document.createElement('div');
        h.className = 'chSec';
        h.textContent = section;
        list.append(h);
      }
      const b = document.createElement('button');
      b.className = 'chRow';
      b.dataset.key = it.key;
      const t = document.createElement('span');
      t.className = 'chTx';
      const tb = document.createElement('b');
      tb.textContent = it.title;
      t.append(tb);
      if (it.sub) {
        const s = document.createElement('small');
        s.textContent = it.sub;
        t.append(s);
      }
      b.append(t);
      if (it.badge) {
        const g = document.createElement('i');
        g.className = it.badgeGo ? 'chBadge go' : 'chBadge';
        g.textContent = it.badge;
        b.append(g);
      }
      list.append(b);
    }
    if (!items.length) {
      const s = document.createElement('small');
      s.className = 'chEmpty';
      s.textContent = o.empty ?? t('Δεν υπάρχει τίποτα εδώ.', 'Nothing here yet.');
      list.append(s);
    }
    const acts = document.createElement('div');
    acts.className = 'askActs';
    const no = button(t('Άκυρο', 'Cancel'), 'no');
    acts.append(no);
    for (const x of o.extra ?? []) {
      const b = button(x.label, 'go');
      b.dataset.key = x.key;
      acts.append(b);
    }
    box.append(list, acts);
    const done = (v: string | null): void => {
      if (open !== cancel) return;
      open = null;
      removeEventListener('keydown', key, true);
      back.remove();
      res(v);
    };
    const cancel = (): void => done(null);
    const key = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cancel();
      }
    };
    open = cancel;
    addEventListener('keydown', key, true);
    no.onclick = cancel;
    box.addEventListener('click', (e) => {
      const k = (e.target as HTMLElement).closest<HTMLElement>('[data-key]')?.dataset.key;
      if (k) done(k);
    });
    back.addEventListener('pointerdown', (e) => {
      if (e.target === back) cancel();
    });
  });
}

/** Μια φυλαγμένη λίστα λέξεων της ορθογραφίας. */
export interface WordList { name: string; text: string }

export interface AskWordsOptions {
  title: string;
  hint: string;
  value?: string;
  /** Η γλώσσα της υπαγόρευσης. */
  voice: string;
  lists: WordList[];
  /** Πόσες λέξεις βγαίνουν από το κείμενο (και πόσες χωρούν στο παιχνίδι). */
  count(text: string): number;
  max: number;
  save(l: WordList): Promise<WordList[]>;
  remove(name: string): Promise<WordList[]>;
  exportAll(): void;
  /** Λίστες από αρχείο· null αν το αρχείο δεν διαβάστηκε. */
  importFile(f: File): Promise<WordList[] | null>;
  /** Το αρχείο λιστών στο Google Drive: `added` πόσες ήρθαν ή ανέβηκαν (-1 στο load: δεν υπάρχει ακόμη αρχείο). */
  drive?: { load(): Promise<{ lists: WordList[]; added: number }>; save(): Promise<{ lists: WordList[]; added: number }> };
  /** 🎲: λίγες λέξεις στην τύχη από αυτά τα κείμενα· `count` πόσες διαφορετικές είχαν όλα μαζί. */
  random?(texts: string[]): { text: string; count: number };
}

/**
 * Οι λέξεις της ορθογραφίας: μεγάλο κουτί για επικόλληση ή υπαγόρευση, και οι φυλαγμένες λίστες με ένα πάτημα.
 * Επιστρέφει το κείμενο των λέξεων για να ξεκινήσει το παιχνίδι, ή null αν ακυρώθηκε.
 */
export function askWords(o: AskWordsOptions): Promise<string | null> {
  return new Promise((res) => {
    const { back, box } = shell(o.title, o.hint);
    box.classList.add('wordsBox');
    let lists = o.lists, armed = '';
    const chips = document.createElement('div');
    chips.className = 'askPicks wordLists';
    const name = document.createElement('input');
    name.className = 'wordName';
    name.placeholder = t('Όνομα της λίστας, για να φυλαχτεί (π.χ. Γλώσσα – Ενότητα 3)', 'List name, to save it (e.g. Spelling – Unit 3)');
    name.maxLength = 60;
    const row = document.createElement('div');
    row.className = 'askIn wordsIn';
    const ta = document.createElement('textarea');
    ta.className = 'askText secret';
    ta.value = o.value ?? '';
    ta.spellcheck = false;
    ta.placeholder = t('μήλο, σχολείο, καλή μέρα\nή μία σε κάθε γραμμή', 'apple, school, good morning\nor one per line');
    ta.rows = 7;
    const side = document.createElement('div');
    side.className = 'wordsSide';
    const eye = button('👁', 'eye');
    eye.title = t('Εμφάνιση / απόκρυψη των λέξεων', 'Show / hide the words');
    eye.onclick = () => ta.classList.toggle('secret');
    const mic = micButton(o.voice, (said) => {
      ta.value = ta.value.trim() ? `${ta.value.trim().replace(/,$/, '')}, ${said}` : said;
      update();
      return o.count(ta.value);
    });
    side.append(eye, mic.btn);
    // 🎲: πατιέται και μετά τσεκάρεις λίστες από πάνω· σε κάθε τσεκάρισμα μπαίνουν 10 λέξεις στην τύχη από όσες τσεκαρίστηκαν
    let picking = false;
    const ticked = new Set<string>();
    let dice: HTMLButtonElement | null = null;
    const roll = (): void => {
      if (!o.random) return;
      const src = lists.filter((l) => ticked.has(l.name));
      if (!src.length) {
        info.textContent = t('🎲 Τσέκαρε από πάνω μία ή περισσότερες λίστες: θα μπουν 10 λέξεις στην τύχη από αυτές.', '🎲 Check one or more lists above: 10 random words will be picked from them.');
        return;
      }
      const r = o.random(src.map((l) => l.text));
      ta.value = r.text;
      // το όνομα σβήνει, για να μη γραφτεί η τυχαία δεκάδα πάνω σε λίστα
      name.value = '';
      update();
      const label = src.length === 1 ? t(`τη λίστα «${src[0].name}»`, `the list “${src[0].name}”`) : t(`${src.length} λίστες`, `${src.length} lists`);
      info.textContent = t(`🎲 ${o.count(r.text)} στην τύχη από ${label} (${r.count} λέξεις). Πάτα ξανά το 🎲 για άλλες.`, `🎲 ${o.count(r.text)} random from ${label} (${r.count} words). Tap 🎲 again for others.`);
    };
    if (o.random) {
      const random = o.random;
      dice = button('🎲', 'eye');
      dice.title = t('Λέξεις στην τύχη: πάτα το 🎲 και τσέκαρε λίστες από πάνω', 'Random words: tap 🎲 and check lists above');
      dice.onclick = () => {
        if (!lists.length) {
          // χωρίς φυλαγμένες λίστες: 10 στην τύχη από ό,τι είναι στο κουτί
          const r = random([ta.value]);
          if (!r.text) {
            info.textContent = t('Δεν υπάρχουν λέξεις για να διαλέξω: γράψε λέξεις ή φύλαξε πρώτα μια λίστα.', 'There are no words to pick from: type some words or save a list first.');
            return;
          }
          ta.value = r.text;
          name.value = '';
          update();
          info.textContent = t(`🎲 ${o.count(r.text)} στην τύχη από τις λέξεις του κουτιού (${r.count} λέξεις).`, `🎲 ${o.count(r.text)} random from the words in the box (${r.count} words).`);
          return;
        }
        // ξανά 🎲 με τσεκαρισμένες λίστες: νέα δεκάδα· χωρίς καμία, το τσεκάρισμα κλείνει
        if (picking && !ticked.size) picking = false;
        else picking = true;
        dice!.classList.toggle('on', picking);
        draw();
        if (picking) roll();
        else info.textContent = t('Το 🎲 έκλεισε: πάτημα σε λίστα τη φορτώνει ολόκληρη.', '🎲 is off: tapping a list loads all of it.');
      };
      side.append(dice);
    }
    row.append(ta, side);
    const info = document.createElement('small');
    const files = document.createElement('div');
    files.className = 'askPicks';
    const pick = document.createElement('input');
    pick.type = 'file';
    pick.accept = '.txt,.csv,.json,text/plain,text/csv,application/json';
    pick.hidden = true;
    const open1 = button(t('📂 Λίστες από αρχείο', '📂 Lists from file'), ''), save1 = button(t('⬇ Όλες οι λίστες σε αρχείο', '⬇ All lists to file'), '');
    open1.onclick = () => pick.click();
    save1.onclick = () => o.exportAll();
    files.append(open1, save1, pick);
    if (o.drive) {
      const drive = o.drive, up = button(t('☁️ Στο Google Drive', '☁️ To Google Drive'), ''), down = button(t('☁️ Από το Google Drive', '☁️ From Google Drive'), '');
      const run = (b: HTMLButtonElement, wait: string, job: () => Promise<{ lists: WordList[]; added: number }>, ok: (n: number) => string): void => {
        b.disabled = true;
        info.textContent = wait;
        // η σύνδεση με τη Google ξεκινά αμέσως μέσα στο πάτημα, αλλιώς ο browser μπλοκάρει το παράθυρό της
        job().then((r) => {
          lists = r.lists;
          draw();
          info.textContent = ok(r.added);
        }, (err: unknown) => {
          info.textContent = t(`Το Google Drive δεν απάντησε: ${err instanceof Error ? err.message : err}`, `Google Drive did not respond: ${err instanceof Error ? err.message : err}`);
        }).finally(() => { b.disabled = false; });
      };
      up.onclick = () => run(up, t('Ανεβαίνουν οι λίστες στο Drive…', 'Uploading lists to Drive…'), drive.save, (n) => t(`Στο Drive υπάρχουν τώρα ${n === 1 ? '1 λίστα' : `${n} λίστες`} (φάκελος PrismaBoard).`, `Drive now has ${n === 1 ? '1 list' : `${n} lists`} (PrismaBoard folder).`));
      down.onclick = () => run(down, t('Φέρνω τις λίστες από το Drive…', 'Getting lists from Drive…'), drive.load, (n) => (n < 0 ? t('Δεν υπάρχουν ακόμη λίστες στο Drive: πάτα πρώτα «Στο Google Drive» από τη συσκευή που τις έχει.', 'There are no lists on Drive yet: first tap “To Google Drive” on the device that has them.') : n ? t(`Ήρθαν ${n === 1 ? '1 λίστα' : `${n} λίστες`} από το Drive.`, `Got ${n === 1 ? '1 list' : `${n} lists`} from Drive.`) : t('Το Drive δεν είχε λίστες.', 'Drive had no lists.')));
      files.append(up, down);
    }
    const acts = document.createElement('div');
    acts.className = 'askActs';
    const no = button(t('Άκυρο', 'Cancel'), 'no'), keep = button(t('💾 Φύλαξε', '💾 Save'), ''), yes = button(t('▶ Ξεκίνα', '▶ Start'), 'go');
    acts.append(no, keep, yes);
    box.append(chips, name, row, info, mic.note, files, acts);

    const update = (): void => {
      const n = o.count(ta.value);
      info.textContent = !n ? t('Γράψε ή επικόλλησε λέξεις, ή διάλεξε μια λίστα από πάνω.', 'Type or paste words, or pick a list above.') : t(`${n === 1 ? '1 λέξη' : `${n} λέξεις`}${n >= o.max ? ` (μπαίνουν οι πρώτες ${o.max})` : ''}`, `${n === 1 ? '1 word' : `${n} words`}${n >= o.max ? ` (the first ${o.max} are used)` : ''}`);
      yes.disabled = keep.disabled = !n;
      keep.disabled ||= !name.value.trim();
      chips.querySelectorAll<HTMLElement>('[data-name]').forEach((c) => c.classList.toggle('on', picking ? ticked.has(c.dataset.name!) : c.dataset.name === name.value.trim()));
    };
    const draw = (): void => {
      chips.replaceChildren();
      if (!lists.length) {
        const none = document.createElement('small');
        none.textContent = t('Δεν έχεις ακόμη φυλαγμένες λίστες: γράψε λέξεις, δώσε όνομα και πάτα «Φύλαξε».', 'You have no saved lists yet: type some words, give them a name and tap “Save”.');
        chips.append(none);
      }
      // λίστα που σβήστηκε δεν μένει τσεκαρισμένη
      for (const n of [...ticked]) if (!lists.some((l) => l.name === n)) ticked.delete(n);
      for (const l of lists) {
        const chip = button(picking ? `${ticked.has(l.name) ? '☑' : '☐'} ${l.name}` : l.name, 'wordChip');
        chip.dataset.name = l.name;
        chip.onclick = () => {
          if (picking) {
            if (ticked.has(l.name)) ticked.delete(l.name);
            else ticked.add(l.name);
            draw();
            roll();
            return;
          }
          name.value = l.name;
          ta.value = l.text;
          update();
        };
        chips.append(chip);
        // στο τσεκάρισμα δεν σβήνονται λίστες
        if (picking) continue;
        // το × θέλει δεύτερο πάτημα, για να μη σβηστεί λίστα κατά λάθος
        const x = document.createElement('span');
        x.className = 'wordDel';
        x.textContent = armed === l.name ? t('Σβήσ’ την;', 'Delete?') : '×';
        x.onclick = (e) => {
          e.stopPropagation();
          if (armed !== l.name) {
            armed = l.name;
            return draw();
          }
          armed = '';
          void o.remove(l.name).then((next) => { lists = next; draw(); });
        };
        chip.append(x);
      }
      update();
    };
    pick.onchange = () => {
      const f = pick.files?.[0];
      pick.value = '';
      if (!f) return;
      void o.importFile(f).then((got) => {
        if (!got) {
          info.textContent = t('Το αρχείο δεν διαβάστηκε: θέλει απλό κείμενο (.txt, .csv) ή αρχείο λιστών του PrismaBoard (.json).', 'The file could not be read: use plain text (.txt, .csv) or a PrismaBoard lists file (.json).');
          return;
        }
        lists = got;
        draw();
        info.textContent = t('Οι λίστες του αρχείου μπήκαν στις λίστες σου.', 'The lists from the file were added to your lists.');
      });
    };
    const store = async (): Promise<void> => {
      const n = name.value.trim();
      if (n && o.count(ta.value)) lists = await o.save({ name: n, text: ta.value.trim() });
    };
    const done = (v: string | null): void => {
      if (open !== cancel) return;
      open = null;
      mic.abort();
      back.remove();
      res(v);
    };
    const cancel = (): void => done(null);
    open = cancel;
    no.onclick = cancel;
    keep.onclick = () => void store().then(() => { draw(); info.textContent = t(`Φυλάχτηκε η λίστα «${name.value.trim()}».`, `Saved the list “${name.value.trim()}”.`); });
    yes.onclick = () => void store().then(() => done(ta.value));
    ta.oninput = name.oninput = update;
    for (const el of [ta, name] as HTMLElement[]) {
      el.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') cancel();
      });
    }
    back.addEventListener('pointerdown', (e) => {
      if (e.target === back) cancel();
    });
    draw();
    ta.focus();
  });
}

/** Μια λίστα στο παράθυρο των έτοιμων λέξεων: `custom` αν την έχει αλλάξει ο δάσκαλος. */
export interface ReadyEdit { id: string; name: string; words: string[]; custom: boolean }

/**
 * Οι έτοιμες λέξεις ενός παιχνιδιού: φαίνονται όλες, × αφαιρεί μία, το πεδίο από κάτω προσθέτει (και πολλές μαζί, με κόμμα),
 * και το «↺ Αρχικές» φέρνει πίσω τις λέξεις της εφαρμογής. Κάθε αλλαγή φυλάγεται αμέσως με το `save` (null = οι αρχικές),
 * που επιστρέφει τη λίστα όπως έμεινε.
 */
export function editReady(o: {
  title: string;
  hint: string;
  lists: ReadyEdit[];
  /** Οι λέξεις που βγαίνουν από ό,τι γράφτηκε, και όσες δεν μπορούν να μπουν (π.χ. μία μόνο συλλαβή). */
  parse(text: string): { ok: string[]; bad: string[] };
  /** Πώς φαίνεται μια λέξη στη λίστα (π.χ. apple = μήλο). */
  show?(word: string): string;
  save(id: string, words: string[] | null): Promise<ReadyEdit>;
}): Promise<void> {
  return new Promise((res) => {
    const { back, box } = shell(o.title, o.hint);
    box.classList.add('wordsBox');
    let lists = o.lists.slice(), cur = 0;
    const tabs = document.createElement('div');
    tabs.className = 'askPicks wordLists';
    const words = document.createElement('div');
    words.className = 'readyWords';
    const info = document.createElement('small');
    const row = document.createElement('div');
    row.className = 'askIn';
    const input = document.createElement('input');
    input.className = 'askText';
    input.placeholder = t('Νέες λέξεις, χωρισμένες με κόμμα', 'New words, separated by commas');
    input.spellcheck = false;
    const add = button(t('＋ Πρόσθεσε', '＋ Add'), 'readyAdd');
    row.append(input, add);
    const acts = document.createElement('div');
    acts.className = 'askActs';
    const reset = button(t('↺ Αρχικές', '↺ Defaults'), 'no'), yes = button(t('Κλείσιμο', 'Close'), 'go');
    acts.append(reset, yes);
    if (lists.length > 1) box.append(tabs);
    box.append(words, info, row, acts);

    const store = (next: string[] | null, msg: string): void => {
      const l = lists[cur];
      void o.save(l.id, next).then((saved) => {
        lists = lists.map((x) => (x.id === saved.id ? saved : x));
        draw();
        info.textContent = msg;
      });
    };
    const draw = (): void => {
      tabs.replaceChildren(...lists.map((l, i) => {
        const b = button(l.custom ? `${l.name} ✎` : l.name, 'wordChip');
        b.classList.toggle('on', i === cur);
        b.onclick = () => { cur = i; draw(); };
        return b;
      }));
      const l = lists[cur];
      words.replaceChildren(...l.words.map((w) => {
        const chip = document.createElement('span');
        chip.className = 'readyWord';
        chip.textContent = o.show ? o.show(w) : w;
        const x = document.createElement('button');
        x.className = 'wordDel';
        x.textContent = '×';
        x.title = t('Αφαίρεση', 'Remove');
        x.onclick = () => {
          if (l.words.length <= 1) {
            info.textContent = t('Μένει τουλάχιστον μία λέξη· πρόσθεσε πρώτα άλλη.', 'At least one word must stay; add another one first.');
            return;
          }
          store(l.words.filter((y) => y !== w), t(`Βγήκε η «${chip.firstChild!.textContent}».`, `Removed “${chip.firstChild!.textContent}”.`));
        };
        chip.append(x);
        return chip;
      }));
      info.textContent = t(`${l.words.length === 1 ? '1 λέξη' : `${l.words.length} λέξεις`} · ${l.custom ? 'με τις δικές σου αλλαγές' : 'οι αρχικές της εφαρμογής'}`, `${l.words.length === 1 ? '1 word' : `${l.words.length} words`} · ${l.custom ? 'with your changes' : 'the app defaults'}`);
      reset.disabled = !l.custom;
    };
    const addWords = (): void => {
      const l = lists[cur], { ok, bad } = o.parse(input.value);
      const fresh = ok.filter((w) => !l.words.includes(w));
      if (!fresh.length && !bad.length) {
        info.textContent = ok.length ? t('Αυτές οι λέξεις υπάρχουν ήδη.', 'These words are already in the list.') : t('Γράψε πρώτα μια λέξη.', 'Type a word first.');
        return;
      }
      input.value = bad.join(', ');
      const msg = `${fresh.length ? (fresh.length === 1 ? t('Μπήκε 1 λέξη.', 'Added 1 word.') : t(`Μπήκαν ${fresh.length} λέξεις.`, `Added ${fresh.length} words.`)) : ''}${bad.length ? t(` Δεν μπαίνουν: ${bad.join(', ')}.`, ` Can't add: ${bad.join(', ')}.`) : ''}`.trim();
      if (fresh.length) store([...l.words, ...fresh], msg);
      else info.textContent = msg;
    };
    add.onclick = addWords;
    reset.onclick = () => store(null, t('Ξαναμπήκαν οι αρχικές λέξεις.', 'The default words are back.'));
    const done = (): void => {
      if (open !== done) return;
      open = null;
      back.remove();
      res();
    };
    open = done;
    yes.onclick = done;
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') addWords();
      if (e.key === 'Escape') done();
    });
    back.addEventListener('pointerdown', (e) => {
      if (e.target === back) done();
    });
    draw();
  });
}
