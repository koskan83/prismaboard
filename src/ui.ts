/** Η σελίδα της εφαρμογής: εικονίδια και το HTML της γραμμής εργαλείων, των μενού και των παραθύρων. */

import { PICS } from './kids/stickers';
import { isEn, t } from './i18n';
import { BETA } from './beta';

export type PenKind = 'pen' | 'laser';
export const LASER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="#ef4444" stroke="none"/></svg>';
export const PENCIL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/></svg>';
export const PEN_ICON: Record<PenKind, string> = { pen: PENCIL_ICON, laser: LASER_ICON };
/** Γραμμικό εικονίδιο 24×24 στο ύφος της μπάρας. */
const IC = (d: string): string => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const P = (d: string): string => IC(`<path d="${d}"/>`);
/** Γραμμή μενού: εικονίδιο και κείμενο. */
const mi = (attr: string, icon: string, label: string): string => `<button ${attr}><i>${icon}</i>${label}</button>`;
/** Πλακίδιο του μενού «Όργανα»: εικονίδιο με μικρή λεζάντα από κάτω. */
const tile = (attr: string, icon: string, label: string, title = label): string =>
  `<button ${attr} class="tile" title="${title}"><span>${icon}</span><small>${label}</small></button>`;
/** Έγχρωμα εικονίδια για εργαλεία του Δημοτικού, στο ύφος των emoji δίπλα τους. */
const K = {
  numline: IC('<path d="M2 15h20M4 12v6M9 12v6M14 12v6M19 12v6"/><circle cx="14" cy="6.500" r="3" fill="#f97316" stroke="none"/>'),
  hundred: IC('<rect x="3" y="3" width="6" height="6" fill="#facc15" stroke="none"/><rect x="9" y="9" width="6" height="6" fill="#facc15" stroke="none"/><rect x="15" y="15" width="6" height="6" fill="#facc15" stroke="none"/><rect x="3" y="3" width="18" height="18" rx="1.500"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
  times: IC('<rect x="3" y="3" width="18" height="18" rx="3" fill="#a855f7" stroke="none"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.600"/>'),
  colops: IC('<rect x="3" y="3" width="5" height="5" rx="1" fill="#22c55e" stroke="none"/><rect x="9.500" y="3" width="5" height="5" rx="1" fill="#ef4444" stroke="none"/><rect x="16" y="3" width="5" height="5" rx="1" fill="#3b82f6" stroke="none"/><path d="M3 12h18M3 20h18" opacity=".45"/><path d="M3 16h18" stroke-width="2.600"/>'),
  fracpie: IC('<path d="M12 12V3a9 9 0 0 1 7.800 13.500z" fill="#f97316" stroke="none"/><circle cx="12" cy="12" r="9"/><path d="M12 3v9l7.800 4.500M12 12l-7.800 4.500"/>'),
  fracbar: IC('<rect x="2" y="8" width="10" height="8" fill="#3b82f6" stroke="none"/><rect x="2" y="8" width="20" height="8" rx="1"/><path d="M7 8v8M12 8v8M17 8v8"/>'),
};
const I = {
  lib: P('M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z'),
  folder: P('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
  save: P('M12 4v11M7 11l5 5 5-5M4 20h16'),
  cloudUp: P('M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-1 8.9M12 12v8M9 15l3-3 3 3'),
  cloudDown: P('M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-1 8.9M12 12v8M9 17l3 3 3-3'),
  doc: P('M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6'),
  image: IC('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>'),
  fit: P('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'),
  clear: P('M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11l4 5M14 11l-4 5'),
  delpage: IC('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 12h6"/>'),
  globe: IC('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  screen: IC('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
  spark: P('M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z'),
  chat: P('M4 5h16v11H10l-5 4v-4H4zM8 9.5h8M8 12.5h5'),
  full: P('M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5'),
  exit: P('M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9'),
  fullExit: P('M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5'),
  target: IC('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5"/>'),
  check: P('M4 6.5l1.500 1.500 3-3M4 12.5l1.5 1.5 3-3M4 18.5l1.5 1.5 3-3M12 7h8M12 13h8M12 19h8'),
  tag: P('M4 5h16M7 5v7M17 5v7M4 16h16M4 20h10'),
  paste: IC('<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5V3h6v2"/>'),
  palette: IC('<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 2-2 0-1.500-1-2 0-3s4 .5 6-1.500A9 9 0 0 0 12 3z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.500" r="1"/><circle cx="16" cy="10" r="1"/>'),
  keys: IC('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
  line: P('M4 20L20 4'),
  arrow: P('M4 20L20 4M11 4h9v9'),
  rect: IC('<rect x="3" y="6" width="18" height="12" rx="1"/>'),
  ellipse: IC('<ellipse cx="12" cy="12" rx="9" ry="6.5"/>'),
  triangle: P('M12 4l9 16H3z'),
  rhombus: P('M12 3l8 9-8 9-8-9z'),
  para: P('M8 6h13l-5 12H3z'),
  table: IC('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 12h18M9 5v14M15 5v14"/>'),
  angle: P('M20 20H4L15 5M11 20a7 7 0 0 0-2.800-5.600'),
  axFull: P('M3 12h18M12 21V3M18.5 9.5L21 12l-2.5 2.5M9.5 5.5L12 3l2.5 2.5'),
  axQ1: P('M5 19h16M5 19V3M18.5 16.5L21 19l-2.5 2.5M2.5 5.500L5 3l2.5 2.5'),
  axQ14: P('M5 12h16M5 21V3M18.5 9.5L21 12l-2.5 2.5M2.5 5.500L5 3l2.5 2.5'),
  asym: IC('<path d="M8 3v18M3 17h18" stroke-dasharray="2.5 3"/><path d="M11 4c.5 7 3 10.500 10 11"/>'),
  trig: IC('<circle cx="12" cy="12" r="8.5"/><path d="M12 12l6-6M3.5 12h17"/>'),
  ruler: IC('<rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/>'),
  protractor: P('M3 17a9 9 0 0 1 18 0zM12 17v-3M7.5 12.500l1.500 1.500M16.5 12.5l-1.5 1.5'),
  compass: IC('<circle cx="12" cy="4.500" r="1.500"/><path d="M12 6L6 21M12 6l6 15M8.500 14h7"/>'),
  poll: IC('<path d="M4 20h16"/><rect x="5" y="11" width="3.500" height="7" rx="1"/><rect x="10.250" y="5" width="3.500" height="13" rx="1"/><rect x="15.500" y="14" width="3.500" height="4" rx="1"/>'),
  lottery: IC('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.300 2.700-6 6-6s6 2.700 6 6"/><path d="M17 4.500l1 2 2.200.300-1.600 1.500.400 2.200-2-1.100-2 1.100.400-2.200"/>'),
  physics: IC('<path d="M2 12h2l1.500-4 2.500 8 2.500-8 2.500 8 1.500-4h1.500"/><rect x="16" y="8" width="6" height="8" rx="1"/>'),
  timer: IC('<circle cx="12" cy="13.500" r="7.500"/><path d="M12 13.500V9.500M9.500 3h5M12 3v3"/>'),
  curtain: IC('<rect x="3" y="4" width="18" height="16" rx="1.500"/><path d="M3 12h18M7 12v8M12 12v8M17 12v8"/>'),
  curtainTop: IC('<rect x="3" y="4" width="18" height="16" rx="1.500"/><path d="M3 12h18M7 12V4M12 12V4M17 12V4"/>'),
  spot: IC('<circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
  play: P('M8 5l11 7-11 7z'),
  send: P('M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2'),
  plus: P('M12 5v14M5 12h14'),
  minus: P('M5 12h14'),
};

/** Στήνει όλα τα στοιχεία της εφαρμογής μέσα στο `app`. */
export function mountUi(app: HTMLElement): void {
  app.insertAdjacentHTML(
  'beforeend',
  `
  <button id="menuBtn" class="fab" title="${t('Μενού', 'Menu')}">☰</button>
  <button id="overlayClose" class="fab hidden" title="${t('Κλείσιμο και επιστροφή στον πίνακα', 'Close and return to the board')}">✕</button>
  <div id="menu" class="popup hidden">
    <div class="gHead">${t('Μάθημα', 'Lesson')}</div>
    ${mi('data-act="lib"', I.lib, t('Μαθήματα…', 'Lessons…'))}
    ${mi('data-act="savewhere"', I.save, t('Αποθήκευση…', 'Save…'))}
    ${mi('data-act="openwhere"', I.folder, t('Άνοιγμα…', 'Open…'))}
    ${mi('data-act="end" class="end"', I.send, t('Τέλος μαθήματος: QR για τους μαθητές', 'End of lesson: QR code for students'))}
    <div class="gHead">${t('Σελίδα', 'Page')}</div>
    <div class="bgRow">
      <span>${t('Φόντο', 'Background')}</span>
      <button data-act="bg-white" class="bgSw" title="${t('Λευκό', 'White')}"></button>
      <button data-act="bg-grid" class="bgSw grid" title="${t('Λευκό με πλέγμα', 'White with grid')}"></button>
      <button data-act="bg-lines" class="bgSw lines" title="${t('Λευκό με γραμμές τετραδίου', 'White with notebook lines')}"></button>
      <button data-act="bg-dark" class="bgSw dark" title="${t('Σκούρο', 'Dark')}"></button>
      <button data-act="bg-dark-grid" class="bgSw dark grid" title="${t('Σκούρο με πλέγμα', 'Dark with grid')}"></button>
      <button data-act="bg-dark-lines" class="bgSw dark lines" title="${t('Σκούρο με γραμμές τετραδίου', 'Dark with notebook lines')}"></button>
      <button data-act="bg-write" class="bgSw write" data-lv="pri" title="${t('Τετράδιο γραφής: γραμμές με βοηθητική για τα μικρά γράμματα', 'Handwriting paper: lines with a guide for lowercase letters')}"></button>
      <button data-act="bg-squares" class="bgSw squares" data-lv="pri" title="${t('Τετράδιο αριθμητικής: μεγάλα τετράγωνα', 'Math paper: large squares')}"></button>
    </div>
    <div class="bgRow">
      <span>${t('Περίγραμμα Α4', 'A4 outline')}</span>
      <button data-act="a4-off" class="a4Sw off" title="${t('Χωρίς περίγραμμα', 'No outline')}">✕</button>
      <button data-act="a4-v" class="a4Sw v" title="${t('Αχνό περίγραμμα Α4 όρθιας: για στοίχιση, και το PDF βγαίνει ακριβώς Α4', 'Faint A4 portrait outline: for alignment, and the PDF comes out exactly A4')}"><i></i></button>
      <button data-act="a4-h" class="a4Sw h" title="${t('Αχνό περίγραμμα Α4 πλάγιας: για στοίχιση, και το PDF βγαίνει ακριβώς Α4', 'Faint A4 landscape outline: for alignment, and the PDF comes out exactly A4')}"><i></i></button>
    </div>
    ${mi('data-act="fit"', I.fit, t('Προσαρμογή προβολής', 'Fit to screen'))}
    ${mi('data-act="clear" class="danger sep"', I.clear, t('Καθαρισμός σελίδας', 'Clear page'))}
    ${mi('data-act="delpage" class="danger"', I.delpage, t('Διαγραφή σελίδας', 'Delete page'))}
    <div class="gHead">${t('Εφαρμογή', 'App')}</div>
    ${mi('data-act="full"', I.full, t('Πλήρης οθόνη', 'Full screen'))}
    ${mi('data-act="overlay" id="overlayAct" class="hidden"', I.screen, t('Γράψιμο πάνω από άλλα προγράμματα', 'Write over other programs'))}
    ${mi('data-act="fxsound" data-lv="pri"', I.spark, t('Ήχοι', 'Sounds'))}
    ${mi('data-act="fxclick" data-lv="pri"', I.spark, t('Ήχος «κλικ» στα κουμπιά των εργαλείων', 'Click sound on tool buttons'))}
    ${mi('data-act="level"', I.target, t('Αλλαγή σε Δημοτικό', 'Switch to Primary school'))}
    ${mi('data-act="help"', I.doc, t('Οδηγίες χρήσης', 'User guide'))}
    ${mi('data-act="lang"', I.globe, isEn ? 'Ελληνικά' : 'English')}
    ${mi('data-act="report"', I.chat, t('Πρόβλημα ή πρόταση; Γράψε μας', 'Problem or idea? Write to us'))}
    ${mi('data-act="more"', I.target, t('Ρυθμίσεις και αρχεία…', 'Settings and files…'))}
    ${mi('data-act="exit" id="exitAct" class="hidden"', I.exit, t('Έξοδος', 'Exit'))}
    <div id="verMain" class="verLine"></div>
  </div>
  <div id="setMenu" class="popup hidden">
    <div class="gHead">${t('Ρυθμίσεις', 'Settings')}</div>
    ${mi('data-act="ai"', I.spark, t('Αναγνώριση γραφής και λύσεις (κλειδί)…', 'Handwriting recognition and solutions (key)…'))}
    ${mi('data-act="labels"', I.tag, t('Ονόματα κάτω από τα εικονίδια', 'Labels under icons'))}
    ${mi('data-act="prettyink"', PENCIL_ICON, t('Ομορφότερη γραφή: λιγότερο τρέμουλο, πάχος σαν στυλό', 'Smoother handwriting: less shake, pen-like thickness'))}
    ${mi('data-act="pdflogo"', I.doc, t('Λογότυπο στις σελίδες του PDF', 'Logo on PDF pages'))}
    ${mi('data-act="startscr"', I.spark, t('«Τι κάνουμε σήμερα;» στο πρώτο άνοιγμα της μέρας', '“What are we doing today?” on the first launch of the day'))}
    ${mi('data-act="snip" class="hidden"', I.screen, t('Ψαλίδι πάνω από άλλες εφαρμογές', 'Snipping tool over other apps'))}
    <div class="gHead">${t('Αρχεία', 'Files')}</div>
    ${mi('data-act="filesdir" class="hidden"', I.folder, t('Φάκελος για τα αρχεία των μαθημάτων…', 'Folder for lesson files…'))}
    ${mi('data-act="filesdrive" class="hidden"', I.save, t('Αρχεία και στο Google Drive, στον φάκελο του τμήματος', 'Also save files to Google Drive, in the class folder'))}
    <div class="gHead">${t('Για προχωρημένους', 'Advanced')}</div>
    ${mi('data-act="diag"', I.target, t('Διάγνωση αφής/γραφίδας', 'Touch and pen diagnostics'))}
    ${mi('data-act="test"', I.check, t('Λίστα δοκιμής στην τάξη', 'Classroom test checklist'))}
    ${mi('data-act="usage"', I.check, t('Τι χρησιμοποιώ', 'What I use'))}
    ${mi('data-act="news"', I.spark, t('Τι νέο', "What's new"))}
    ${mi('data-act="licenses"', I.doc, t('Απόρρητο και άδειες τρίτων', 'Privacy and third-party licenses'))}
    <div id="verLine" class="verLine"></div>
  </div>
  <div id="whereMenu" class="popup hidden">
    <div class="gHead" data-for="save">${t('Αποθήκευση του μαθήματος', 'Save the lesson')}</div>
    ${mi('data-act="save" data-for="save"', I.save, t('Στον δίσκο, σε αρχείο', 'To disk, as a file'))}
    ${mi('data-act="drivesave" data-for="save" data-drive', I.cloudUp, t('Στο Google Drive', 'To Google Drive'))}
    <div class="gHead" data-for="save">${t('Εξαγωγή και αποστολή', 'Export and share')}</div>
    ${mi('data-act="pdf" data-for="save"', I.doc, t('Σε PDF…', 'As PDF…'))}
    ${mi('data-act="png" data-for="save"', I.image, t('Η σελίδα σε εικόνα PNG', 'Page as PNG image'))}
    ${mi('data-act="send" data-for="save"', I.send, t('Στους μαθητές, με επιλογή σελίδων…', 'To students, choosing pages…'))}
    <div class="gHead" data-for="open">${t('Άνοιγμα μαθήματος', 'Open a lesson')}</div>
    ${mi('data-act="open" data-for="open"', I.folder, t('Από τον δίσκο, από αρχείο…', 'From disk, from a file…'))}
    ${mi('data-act="driveopen" data-for="open" data-drive', I.cloudDown, t('Από το Google Drive…', 'From Google Drive…'))}
  </div>

  <div id="zoomCtl">
    <button id="zoomOut" title="${t('Σμίκρυνση', 'Zoom out')}">${I.minus}</button>
    <button id="zoomFit" title="${t('Προσαρμογή: όλη η σελίδα στην οθόνη', 'Fit: whole page on screen')}">100%</button>
    <button id="zoomIn" title="${t('Μεγέθυνση', 'Zoom in')}">${I.plus}</button>
    <button id="fsExit" class="hidden" title="${t('Έξοδος από πλήρη οθόνη', 'Exit full screen')}">${I.fullExit}</button>
  </div>
  <div id="toolbarWrap">
  <div id="toolbar">
    <div id="barTab">
      <button id="barDrag"><span>⠿</span>${t('Μετακίνηση γραμμής εργαλείων', 'Move toolbar')}</button>
      <button id="barSmaller"><span>−</span>${t('Μικρότερη', 'Smaller')}</button>
      <button id="barBigger"><span>＋</span>${t('Μεγαλύτερη', 'Larger')}</button>
      <button id="barFold"><span>▾</span>${t('Σύμπτυξη', 'Collapse')}</button>
    </div>
    <div id="subbar">
      <div class="group hidden" id="selOpts">
        <button id="del" title="${t('Διαγραφή επιλογής', 'Delete selection')}" data-l="${t('Διαγραφή', 'Delete')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></span></button>
        <button id="dup" title="${t('Αντίγραφο επιλογής', 'Duplicate selection')}" data-l="${t('Αντίγραφο', 'Duplicate')}"><span class="txt">×2</span></button>
        <button id="bigger" title="${t('Μεγαλύτερο (και τα γράμματα των κειμένων)', 'Bigger (text too)')}" data-l="${t('Μεγαλύτερο', 'Bigger')}"><span class="txt">＋</span></button>
        <button id="smaller" title="${t('Μικρότερο (και τα γράμματα των κειμένων)', 'Smaller (text too)')}" data-l="${t('Μικρότερο', 'Smaller')}"><span class="txt">−</span></button>
        <button id="flipH" title="${t('Καθρέφτης: αριστερά–δεξιά', 'Mirror: left–right')}" data-l="${t('Καθρέφτης', 'Mirror')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18" stroke-dasharray="2 2.5"/><path d="M9 6L3 18h6z"/><path d="M15 6l6 12h-6z" fill="currentColor" fill-opacity=".25"/></svg></span></button>
        <button id="flipV" title="${t('Καθρέφτης: πάνω–κάτω', 'Mirror: top–bottom')}" data-l="${t('Πάνω–κάτω', 'Top–bottom')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18" stroke-dasharray="2 2.5"/><path d="M6 9L18 3v6z"/><path d="M6 15l12 6v-6z" fill="currentColor" fill-opacity=".25"/></svg></span></button>
        <button id="sumBtn" title="${t('Συνισταμένη: δύο βέλη ή ευθείες με κοινή κορυφή, ή μία γωνία', 'Resultant: two arrows or lines with a common vertex, or one angle')}" data-l="${t('Συνισταμένη', 'Resultant')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l5-12M4 20l11-3"/><path d="M4 20L20 5" stroke="#60a5fa"/><path d="M14 5h6v6" stroke="#60a5fa"/></svg></span></button>
        <button id="tidyBtn" title="${t('Τακτοποίηση της χειρόγραφης γραφής: ίσια σειρά, ίσα κενά ανάμεσα στις λέξεις (μένει χειρόγραφη)', 'Tidy handwriting: straight line, even spacing between words (stays handwritten)')}" data-l="${t('Τακτοποίηση', 'Tidy')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18" stroke-dasharray="2 2.5"/><path d="M4 16c1-6 3-6 4 0M10 16c0-3 1-5 3-5s3 2 3 5M18 9v7"/></svg></span></button>
        <button id="angBtn" title="${t('Γωνία ανάμεσα στις ευθείες: κρύψιμο ή εμφάνιση (σβήνεται και με τη γόμα πάνω στις μοίρες)', 'Angle between lines: hide or show (you can also erase it over the degrees)')}" data-l="${t('Γωνία', 'Angle')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 19H4L16 5"/><path d="M11 19a7 7 0 0 0-2.400-5.300"/></svg></span></button>
        <button id="moveBtn" title="${t('Μεταφορά της επιλογής σε άλλη σελίδα (ή σε νέα), στην ίδια θέση', 'Move the selection to another page (or a new one), in the same position')}" data-l="${t('Σε σελίδα', 'To page')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h8l3 3v5M4 4v16h7"/><path d="M14 17h7M18 14l3 3-3 3"/></svg></span></button>
        <i class="sep recSep"></i>
        <button data-rec="text" class="rec" title="${t('Αναγνώριση της επιλογής ως κείμενο', 'Recognize the selection as text')}" data-l="${t('Σε κείμενο', 'To text')}"><span class="txt">Aα</span></button>
        <button data-rec="math" class="rec" data-lv="sec" title="${t('Αναγνώριση της επιλογής ως τύπο', 'Recognize the selection as a formula')}" data-l="${t('Σε τύπο', 'To math')}"><span class="txt">√x</span></button>
        <button data-rec="solve" class="rec solve" data-lv="sec" title="${t('Λύση της επιλεγμένης άσκησης (μπαίνει από κάτω)', 'Solve the selected exercise (added below)')}" data-l="${t('Λύση', 'Solve')}"><span class="txt">x=?</span></button>
        <button data-rec="spell" class="rec check" data-lv="pri" title="${t('Έλεγχος ορθογραφίας: από κάτω γράφεται ποιες λέξεις θέλουν διόρθωση', 'Spell check: shows below which words need correcting')}" data-l="${t('Ορθογραφία', 'Spelling')}"><span class="txt">αβγ</span></button>
        <button data-speak="1" class="rec" data-lv="pri" title="${t('Ο πίνακας διαβάζει φωναχτά το επιλεγμένο κείμενο', 'The board reads the selected text aloud')}" data-l="${t('Διάβασέ το', 'Read aloud')}"><span class="txt">🔊</span></button>
        <button data-spellwords="1" class="rec" data-lv="pri" title="${t('Ορθογραφία με το τερατάκι με τις επιλεγμένες λέξεις (γραμμένες με το «Κείμενο» ή με το χέρι)', 'Spelling monster game with the selected words (typed with “Text” or handwritten)')}" data-l="${t('Τερατάκι', 'Monster')}"><span class="txt">👾</span></button>
        <button data-rec="graph" class="rec graph" data-lv="sec" title="${t('Γραφική παράσταση της επιλεγμένης συνάρτησης, σε άξονες που ταιριάζουν στο πεδίο ορισμού της', 'Graph the selected function, on axes that fit its domain')}" data-l="${t('Γραφική', 'Graph')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v17h17"/><path d="M6 17c3 0 4-11 7-11s3 7 7 7"/></svg></span></button>
        <button data-rec="figure" class="rec graph" data-lv="sec" title="${t('Σχήμα για την επιλεγμένη εκφώνηση (π.χ. Φυσικής): μπαίνει από κάτω, αν η άσκηση χρειάζεται σχήμα', 'Diagram for the selected problem (e.g. physics): added below if the exercise needs one')}" data-l="${t('Σχήμα', 'Diagram')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18M5 19L17 8v11"/><rect x="9.500" y="8.800" width="5" height="4" transform="rotate(-42.500 12 10.800)"/></svg></span></button>
        <button data-rec="check" class="rec check" title="${t('Έλεγχος της λύσης ενός μαθητή: δείχνει σε ποια γραμμή είναι το πρώτο λάθος', "Check a student's solution: shows the line with the first mistake")}" data-l="${t('Έλεγχος', 'Check')}"><span class="txt">✓?</span></button>
      </div>
      <div class="group" id="penKinds">
        <button data-pen="pen"><span>${PENCIL_ICON}</span>${t('Στυλό', 'Pen')}</button>
        <button data-pen="laser"><span>${LASER_ICON}</span>${t('Δείκτης λέιζερ (σβήνει μόνος του)', 'Laser pointer (fades on its own)')}</button>
        <button data-auto="text" class="rec"><span>Aα</span>${t('Αυτόματη αναγνώριση κειμένου: ό,τι γράφεις γίνεται καθαρό κείμενο μόλις σταματήσεις', 'Auto text recognition: what you write becomes clean text when you stop')}</button>
        <button data-auto="math" class="rec" data-lv="sec"><span>√x</span>${t('Αυτόματη αναγνώριση τύπων: ό,τι γράφεις γίνεται τυπωμένος τύπος μόλις σταματήσεις', 'Auto math recognition: what you write becomes a typeset formula when you stop')}</button>
      </div>
      <div class="group" id="shapes">
        <button data-shape="line"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L20 4"/></svg></span>${t('Ευθεία', 'Line')}</button>
        <button data-shape="arrow"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L20 4M11 4h9v9"/></svg></span>${t('Βέλος', 'Arrow')}</button>
        <button data-shape="rect"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1"/></svg></span>${t('Ορθογώνιο', 'Rectangle')}</button>
        <button data-shape="ellipse"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="7"/></svg></span>${t('Έλλειψη', 'Ellipse')}</button>
        <button data-shape="triangle"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l9 16H3z"/></svg></span>${t('Τρίγωνο', 'Triangle')}</button>
        <button data-shape="rhombus"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 9-8 9-8-9z"/></svg></span>${t('Ρόμβος', 'Rhombus')}</button>
        <button data-shape="para"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13l-5 12H3z"/></svg></span>${t('Παραλληλόγραμμο', 'Parallelogram')}</button>
        <button data-shape="angle"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 19H4L16 5"/><path d="M11 19a7 7 0 0 0-2.400-5.300"/></svg></span>${t('Γωνία με μοίρες', 'Angle with degrees')}</button>
      </div>
      <div class="group" id="eraserOpts">
        <button data-eraser="partial"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8" stroke-dasharray="2.5 3"/></svg></span>${t('Σβήνει μόνο ό,τι είναι μέσα στον κύκλο', 'Erases only what is inside the circle')}</button>
        <button data-eraser="stroke"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14c3-7 5 5 8-1s5 5 10-3"/><path d="M5 5l14 14" stroke="#f87171"/></svg></span>${t('Σβήνει ολόκληρη τη γραμμή', 'Erases the whole stroke')}</button>
        <button id="eraseAll"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11l4 5M14 11l-4 5"/></svg></span>${t('Σβήσιμο όλων', 'Erase all')}</button>
      </div>
      <div class="group" id="axesOpts">
        <button data-axis="x" data-l="${t('Άξονας x', 'x-axis')}"><span>x</span>${t('Όνομα οριζόντιου άξονα', 'Horizontal axis name')}</button>
        <button data-axis="y" data-l="${t('Άξονας y', 'y-axis')}"><span>y</span>${t('Όνομα κατακόρυφου άξονα', 'Vertical axis name')}</button>
        <button id="axScale" data-l="${t('Κλίμακα', 'Scale')}"><span class="txt">×1</span>${t('Κλίμακα οριζόντιου άξονα: διάλεξε πόσο αξίζει μια γραμμή (×2 έως ×100, ή υποδιαίρεση ÷2 έως ÷100). Ο κατακόρυφος προσαρμόζεται μόνος του', 'Horizontal axis scale: choose what one gridline is worth (×2 to ×100, or subdivisions ÷2 to ÷100). The vertical axis adjusts on its own')}</button>
        <button id="axNums" data-l="${t('Αριθμοί', 'Numbers')}"><span class="txt">123</span>${t('Αριθμοί στους άξονες: σβήσε τους για να γράψεις δικές σου τιμές (π.χ. ανά 10 ή 20)', 'Numbers on the axes: erase them to write your own values (e.g. every 10 or 20)')}</button>
        <i class="sep"></i>
        <button id="fnBtn" data-l="${t('Συνάρτ.', 'Function')}"><span class="txt">f(x)</span>${t('Γραφική παράσταση συνάρτησης', 'Graph a function')}</button>
        <i class="sep"></i>
        <button data-an="int" data-l="${t('Εμβαδόν', 'Area')}"><span class="txt">∫</span>${t('Ορισμένο ολοκλήρωμα ως εμβαδόν (δεύτερο πάτημα: χωρίο ανάμεσα σε δύο συναρτήσεις)', 'Definite integral as area (tap again: region between two functions)')}</button>
        <button data-an="sum" data-l="Riemann"><span class="txt">Σ</span>${t('Αθροίσματα Riemann: κάθε πάτημα διπλασιάζει τα ορθογώνια (4, 8, 16, 32)', 'Riemann sums: each tap doubles the rectangles (4, 8, 16, 32)')}</button>
        <button data-an="lim" data-l="${t('Όριο', 'Limit')}"><span class="txt">lim</span>${t('Όριο σε σημείο: σύρε το σημείο πάνω στην καμπύλη προς το x₀', 'Limit at a point: drag the point along the curve toward x₀')}</button>
        <button data-an="tan" data-l="${t('Εφαπτ.', 'Tangent')}"><span class="txt">f′</span>${t('Εφαπτομένη και παράγωγος (δεύτερο πάτημα: και η τέμνουσα)', 'Tangent and derivative (tap again: the secant too)')}</button>
        <button data-an="asym" data-l="${t('Ασύμπτ.', 'Asympt.')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v18M3 17h18" stroke-dasharray="2.5 3"/><path d="M11 4c.5 7 3 10.500 10 11"/></svg></span>${t('Ασύμπτωτες', 'Asymptotes')}</button>
      </div>
      <div class="group" id="springOpts">
        <button id="spPlay" data-l="${t('Κίνηση', 'Motion')}"><span class="txt">▶</span>${t('Κίνηση: ξεκινά ή σταματά (κύματα, κρούση, βολή, κυκλική κίνηση)', 'Motion: start or stop (waves, collisions, projectiles, circular motion)')}</button>
        <button id="spMarks" data-l="${t('Θέσεις', 'Positions')}"><span class="txt">${t('ΘΦΜ', 'L₀')}</span>${t('Εμφάνιση θέσης φυσικού μήκους, θέσης ισορροπίας και ±A (στο εκκρεμές: ισορροπία και ακραίες θέσεις)', 'Show natural length position, equilibrium position and ±A (for the pendulum: equilibrium and extreme positions)')}</button>
        <button id="spDamp" data-l="${t('Απόσβ.', 'Damping')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c1.500-9 3.500-9 5 0s3 6 4.500 0 2.500-4 3.500 0 2 2.500 3 0 1.500-1 2 0h1.500"/></svg></span>${t('Απόσβεση: η ταλάντωση σβήνει σιγά σιγά', 'Damping: the oscillation slowly dies out')}</button>
        <button id="spStop" data-l="${t('Στοπ', 'Stop')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg></span>${t('Σταμάτημα ταλάντωσης', 'Stop oscillation')}</button>
      </div>
      <div class="group" id="widths"></div>
    </div>
    <div class="group" id="tools">
      <button data-tool="select" data-l="${t('Επιλογή', 'Select')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="13" height="11" rx="1.5" stroke-dasharray="3 2.5"/><path d="M12 11l9 4.5-4 1.3-1.3 4z" fill="currentColor"/></svg></span>${t('Επιλογή (σύρε γύρω από πολλά για ομαδική επιλογή)', 'Select (drag around several items to select them together)')}</button>
      <button id="penBtn" data-l="${t('Γραφή', 'Write')}"><span>${PENCIL_ICON}</span>${t('Γραφή', 'Write')}</button>
      <button data-tool="highlighter" data-l="${t('Υπογρ.', 'Highlight')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3l6 6-8 8H8l-2-2v-4z"/><path d="M3 21h13" stroke="#facc15" stroke-width="3.5"/></svg></span>${t('Υπογραμμιστικό', 'Highlighter')}</button>
      <button data-tool="text" data-l="${t('Κείμενο', 'Text')}"><span>T</span>${t('Κείμενο', 'Text')}</button>
      <button data-tool="eraser" data-l="${t('Γόμα', 'Eraser')}"><span><svg viewBox="0 0 24 24"><g transform="rotate(-40 12 12)"><rect x="3" y="7.5" width="9" height="9" rx="1.5" fill="#fb7185"/><rect x="12" y="7.5" width="9" height="9" rx="1.5" fill="#60a5fa"/><rect x="11" y="7.5" width="2" height="9" fill="#f9fafb"/></g></svg></span>${t('Γόμα', 'Eraser')}</button>
      <button data-tool="measure" data-lv="sec" data-l="${t('Μέτρηση', 'Measure')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16L16 3l5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/></svg></span>${t('Μετρήσεις: πάτα ένα σχήμα για μήκη, γωνίες, εμβαδόν, περίμετρο· σύρε μέσα σε μια γωνία για να τη μετρήσεις', 'Measurements: tap a shape for lengths, angles, area and perimeter; drag inside an angle to measure it')}</button>
      <button data-tool="hand" data-l="${t('Κίνηση', 'Pan')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg></span>${t('Μετακίνηση πίνακα', 'Move the board')}</button>
    </div>
    <div class="group" id="colors"></div>
    <div class="group">
      <button id="undo" data-l="${t('Αναίρ.', 'Undo')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4L3 9l5 5"/><path d="M3 9h11a5.5 5.5 0 0 1 0 11h-4"/></svg></span>${t('Αναίρεση', 'Undo')}</button>
      <button id="redo" data-l="${t('Ξανά', 'Redo')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4l5 5-5 5"/><path d="M21 9H10a5.5 5.5 0 0 0 0 11h4"/></svg></span>${t('Επανάληψη', 'Redo')}</button>
    </div>
    <div class="group">
      <button id="importBtn" class="accent" data-l="${t('Εισαγ.', 'Insert')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span>${t('Εισαγωγή', 'Insert')}</button>
      <button id="gadgetBtn" data-l="${t('Όργανα', 'Tools')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3l4.5 8h-9z"/><circle cx="17" cy="7.5" r="4"/><rect x="4" y="14" width="7" height="7" rx="1"/><path d="M14 21l7-7"/></svg></span>${t('Όργανα και βοηθήματα', 'Tools and aids')}</button>
    </div>
    <div class="group hidden" id="favs"></div>
    <div class="group pages">
      <button id="prev"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></span></button>
      <div id="pageLabel">1 / 1</div>
      <button id="next"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></span></button>
      <button id="addPage" data-l="${t('Σελίδα', 'Page')}"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="13" height="15" rx="2"/><path d="M4 7v12a2 2 0 0 0 2 2h10M13.5 7v7M10 10.5h7"/></svg></span>${t('Σελίδα', 'Page')}</button>
    </div>
  </div>
  </div>
  <div id="dockHint" class="hidden"></div>

  <div id="importMenu" class="popup hidden">
    ${mi('data-imp="file"', I.folder, t('Εικόνα, PDF ή Word από αρχείο…', 'Image, PDF or Word from file…'))}
    ${mi('data-imp="doc" class="hidden"', I.doc, t('PDF ή Word από αρχείο…', 'PDF or Word from file…'))}
    ${mi('data-imp="shot"', I.screen, t('Στιγμιότυπο οθόνης', 'Screenshot'))}
    ${mi('data-imp="paste"', I.paste, t('Επικόλληση από το πρόχειρο', 'Paste from clipboard'))}
    <hr />
    ${mi('data-ins="tpl"', I.doc, t('Σελίδα από πρότυπο…', 'Page from template…'))}
  </div>

  <div id="stampMenu" class="popup hidden"><div id="stampGrid"></div></div>
  <div id="tableMenu" class="popup hidden">
    <div class="bgRow" id="tblStyles">
      <button data-tbl="grid" class="pill">${t('Πίνακας', 'Table')}</button>
      <button data-tbl="det" class="pill">${t('Ορίζουσα | |', 'Determinant | |')}</button>
      <button data-tbl="matrix" class="pill">${t('Μήτρα [ ]', 'Matrix [ ]')}</button>
    </div>
    <div id="tblGrid"></div>
    <div class="hint" id="tblHint"></div>
  </div>

  <div id="tplMenu" class="popup hidden">
    <div id="tplList"></div>
    <hr />
    ${mi('id="tplSave"', I.plus, t('Αποθήκευση της σελίδας ως πρότυπο', 'Save page as template'))}
  </div>

  <div id="gadgetMenu" class="popup hidden">
    <div id="favBar"><span id="favMsg">${t('Πάτα έως 6 όργανα για να μπουν στη μπάρα', 'Tap up to 6 tools to add them to the bar')}</span><button id="favEdit" class="pill" title="${t('Διάλεξε έως 6 όργανα που θα είναι πάντα στη βασική μπάρα', 'Choose up to 6 tools to keep on the main bar')}">${t('☆ Αγαπημένα', '☆ Favorites')}</button></div>
    <div class="gHead" id="recentHead">${t('Πρόσφατα', 'Recent')}</div>
    <div class="tiles" id="recentTiles"></div>
    <div id="gTabs" data-lv="pri">
      <button data-gtab="num">${t('Αριθμοί', 'Numbers')}</button>
      <button data-gtab="frac">${t('Κλάσματα', 'Fractions')}</button>
      <button data-gtab="time">${t('Ώρα · Χρήματα', 'Time · Money')}</button>
      <button data-gtab="shape">${t('Σχήματα', 'Shapes')}</button>
      <button data-gtab="play">${t('Παιχνίδια', 'Games')}</button>
    </div>
    <div class="gHead" data-lv="pri" data-tab="num">${t('Αριθμοί και πράξεις', 'Numbers and operations')}</div>
    <div class="tiles" data-lv="pri" data-tab="num">
      ${tile('data-kid="numline"', K.numline, t('Αριθμογραμμή', 'Number line'), t('Αριθμογραμμή: το ⟳ αλλάζει από πού ως πού', 'Number line: ⟳ changes the range'))}
      ${tile('data-kid="blocks"', '<b class="em">🔢</b>', t('Ε Δ Μ', 'H T O'), t('Εκατοντάδες, δεκάδες, μονάδες με κυβάκια: πάνω από 9 περνά ένα στην επόμενη στήλη', 'Hundreds, tens and ones with cubes: past 9, one carries over to the next column'))}
      ${tile('data-kid="hundred"', K.hundred, t('Πίνακας 100', '100 chart'), t('Πίνακας του 100: πατάς αριθμούς και χρωματίζονται', 'Hundred chart: tap numbers to color them'))}
      ${tile('data-kid="times"', K.times, t('Προπαίδεια', 'Times table'), t('Προπαίδεια: πατάς ένα κουτί και φαίνεται το γινόμενο', 'Times table: tap a box to see the product'))}
      ${tile('data-kid="colops"', K.colops, t('Κάθετη πράξη', 'Column math'), t('Πλέγμα για κάθετη πράξη με κρατούμενα', 'Grid for column arithmetic with carrying'))}
      ${tile('data-kid="balance"', '<b class="em">⚖️</b>', t('Ζυγαριά', 'Balance'), t('Ζυγαριά: βάζεις αριθμούς και γέρνει προς το μεγαλύτερο άθροισμα', 'Balance: add numbers and it tips toward the larger sum'))}
    </div>
    <div class="gHead" data-lv="pri" data-tab="frac">${t('Κλάσματα', 'Fractions')}</div>
    <div class="tiles" data-lv="pri" data-tab="frac">
      ${tile('data-kid="fracpie"', K.fracpie, t('Πίτα', 'Pie'), t('Κλάσμα σε κύκλο: πατάς κομμάτια και χρωματίζονται. Το 🎯 βάζει άσκηση', 'Fraction circle: tap pieces to color them. 🎯 gives an exercise'))}
      ${tile('data-kid="fracbar"', K.fracbar, t('Μπάρα', 'Bar'), t('Κλάσμα σε μπάρα: για σύγκριση και ισοδύναμα κλάσματα. Το 🎯 βάζει άσκηση', 'Fraction bar: for comparing and equivalent fractions. 🎯 gives an exercise'))}
      ${tile('data-kid="fracpizza"', '<b class="em">🍕</b>', t('Πίτσα', 'Pizza'), t('Κλάσμα σε πίτσα: τα κομμάτια που παίρνεις φαίνονται ολόκληρα', 'Fraction pizza: the pieces you take are shown whole'))}
      ${tile('data-kid="fracchoc"', '<b class="em">🍫</b>', t('Σοκολάτα', 'Chocolate'), t('Κλάσμα σε σοκολάτα: τα κομμάτια που παίρνεις φαίνονται ολόκληρα', 'Fraction chocolate bar: the pieces you take are shown whole'))}
    </div>
    <div class="gHead" data-lv="pri" data-tab="time">${t('Χρόνος και χρήματα', 'Time and money')}</div>
    <div class="tiles" data-lv="pri" data-tab="time">
      ${tile('data-kid="clock"', '<b class="em">🕒</b>', t('Ρολόι', 'Clock'), t('Ρολόι: σέρνεις τους δείκτες. Το 🎯 βάζει άσκηση («Δείξε 7:45»)', 'Clock: drag the hands. 🎯 gives an exercise (“Show 7:45”)'))}
      ${tile('data-kid="money"', '<b class="em">💶</b>', t('Χρήματα', 'Money'), t('Κέρματα και χαρτονομίσματα ευρώ', 'Euro coins and banknotes'))}
      ${tile('data-gadget="timer"', I.timer, t('Χρονόμετρο', 'Timer'))}
    </div>
    <div class="gHead" data-tab="shape">${t('Σχήματα', 'Shapes')}</div>
    <div class="tiles" data-tab="shape">
      ${tile('data-shape="line"', I.line, t('Ευθεία', 'Line'))}
      ${tile('data-shape="arrow"', I.arrow, t('Βέλος', 'Arrow'))}
      ${tile('data-shape="rect"', I.rect, t('Ορθογώνιο', 'Rectangle'))}
      ${tile('data-shape="ellipse"', I.ellipse, t('Κύκλος', 'Circle'), t('Κύκλος ή έλλειψη', 'Circle or ellipse'))}
      ${tile('data-shape="triangle"', I.triangle, t('Τρίγωνο', 'Triangle'))}
      ${tile('data-shape="rhombus"', I.rhombus, t('Ρόμβος', 'Rhombus'))}
      ${tile('data-shape="para"', I.para, t('Παραλληλό&shy;γραμμο', 'Parallelo&shy;gram'), t('Παραλληλόγραμμο', 'Parallelogram'))}
      ${tile('data-shape="angle"', I.angle, t('Γωνία', 'Angle'), t('Γωνία με μοίρες', 'Angle with degrees'))}
      ${tile('data-ins="table"', I.table, t('Πίνακας…', 'Table…'), t('Πίνακας, ορίζουσα ή μήτρα: διαλέγεις γραμμές και στήλες', 'Table, determinant or matrix: choose rows and columns'))}
    </div>
    <div class="gHead" data-lv="sec">${t('Άξονες', 'Axes')}</div>
    <div class="tiles" data-lv="sec">
      ${tile('data-axes="full"', I.axFull, t('Άξονες', 'Axes'), t('Άξονες με 4 τεταρτημόρια', 'Axes with 4 quadrants'))}
      ${tile('data-axes="q1"', I.axQ1, t('1ο τεταρτ.', 'Quadrant I'), t('Άξονες: 1ο τεταρτημόριο', 'Axes: 1st quadrant'))}
      ${tile('data-axes="q14"', I.axQ14, 'x ≥ 0', t('Άξονες: 1ο και 4ο τεταρτημόριο (x ≥ 0)', 'Axes: 1st and 4th quadrants (x ≥ 0)'))}
      ${tile('data-ins="trig"', I.trig, t('Τριγ. κύκλος', 'Unit circle'), t('Τριγωνομετρικός κύκλος', 'Unit circle'))}
    </div>
    <div class="gHead" data-lv="sec">${t('Ανάλυση συνάρτησης', 'Function analysis')}</div>
    <div class="tiles" data-lv="sec">
      ${tile('data-anq="int"', '<b>∫</b>', t('Ολοκλήρωμα', 'Integral'), t('Ορισμένο ολοκλήρωμα ως εμβαδόν', 'Definite integral as area'))}
      ${tile('data-anq="sum"', '<b>Σ</b>', 'Riemann', t('Αθροίσματα Riemann', 'Riemann sums'))}
      ${tile('data-anq="lim"', '<b class="sm">lim</b>', t('Όριο', 'Limit'), t('Όριο σε σημείο', 'Limit at a point'))}
      ${tile('data-anq="tan"', '<b>f′</b>', t('Εφαπτομένη', 'Tangent'), t('Εφαπτομένη και παράγωγος', 'Tangent and derivative'))}
      ${tile('data-anq="asym"', I.asym, t('Ασύμπτωτες', 'Asymptotes'))}
    </div>
    <div class="gHead" data-tab="shape"><span data-lv="sec">${t('Όργανα και φυσική', 'Tools and physics')}</span><span data-lv="pri">${t('Όργανα', 'Tools')}</span></div>
    <div class="tiles" data-tab="shape">
      ${tile('data-gadget="ruler"', I.ruler, t('Χάρακας', 'Ruler'))}
      ${tile('data-gadget="protractor"', I.protractor, t('Μοιρογνω&shy;μόνιο', 'Protrac&shy;tor'), t('Μοιρογνωμόνιο', 'Protractor'))}
      ${tile('data-gadget="compass"', I.compass, t('Διαβήτης', 'Compass'))}
      ${tile('data-ins="stamps" data-lv="sec"', I.physics, t('Φυσική…', 'Physics…'), t('Σχήματα φυσικής', 'Physics diagrams'))}
      ${tile('data-kid="poll" data-lv="sec"', I.poll, t('Ψηφοφορία', 'Poll'), t('Ψηφοφορία της τάξης: Α Β Γ Δ ή ναι/όχι, με ραβδόγραμμα στο τέλος', 'Class poll: A B C D or yes/no, with a bar chart at the end'))}
      ${tile('data-kid="lottery" data-lv="sec"', I.lottery, t('Κλήρωση', 'Random pick'), t('Κλήρωση: βγάζει τυχαίο μαθητή του τμήματος (ή αριθμό, αν το τμήμα δεν έχει ονόματα)', 'Random pick: draws a random student from the class (or a number, if the class has no names)'))}
    </div>
    <div class="gHead" data-lv="pri" data-tab="num">${t('Εικόνες για μέτρημα', 'Pictures for counting')}</div>
    <div class="tiles small" data-lv="pri" data-tab="num">
      ${PICS.map(([key, emoji, label]) => `<button data-kid="pic-${key}" class="tile pic" title="${label}"><span><b class="em">${emoji}</b></span></button>`).join('')}
    </div>
    <div class="gHead" data-lv="pri" data-tab="play">${t('Παιχνίδια', 'Games')}</div>
    <div class="tiles" data-lv="pri" data-tab="play">
      ${tile('data-kid="build"', '<b class="em">🧱</b>', t('Τουβλάκια', 'Bricks'), t('Χτίσιμο με τουβλάκια: διαλέγεις υλικό και σέρνεις για να χτίσεις', 'Build with bricks: pick a material and drag to build'))}
      ${tile('data-kid="numcubes"', '<b class="em">🟥</b>', t('Κυβάκια και αριθμοί', 'Cubes and numbers'), t('Κυβάκια και αριθμοί 1–100: σέρνεις το ένα πάνω στο άλλο και ενώνονται, ✂️ τα χωρίζει, και αλλάζουν σχήμα, χρώμα και αξεσουάρ· ⚖️ ζυγαριά για αθροίσματα', 'Cubes and numbers 1–100: drag one onto another to join them, ✂️ splits them, and you can change shape, color and accessories; ⚖️ balance for sums'))}
      ${tile('data-kid="spell"', '<b class="em">👾</b>', t('Ορθογραφία', 'Spelling'), t('Ορθογραφία: έτοιμες λέξεις ανά τάξη ή δικές σου· ο μαθητής γράφει, το τερατάκι τρώει τα λάθη και μεγαλώνει, και ο μαθητής γράφει το σωστό στα κενά', 'Spelling: ready-made words by grade or your own; the student writes, the monster eats the mistakes and grows, and the student fills in the right letters'))}
      ${tile('data-kid="syllables"', '<b class="em">🐸</b>', t('Συλλαβές', 'Syllables'), t('Συλλαβές: ένα νούφαρο για κάθε συλλαβή, κάθε γράμμα στο νούφαρό του, και το βατραχάκι πηδά απέναντι', 'Syllables: a lily pad for each syllable, each letter on its lily pad, and the frog hops across'))}
      ${tile('data-kid="hangman"', '<b class="em">🔡</b>', t('Κρεμάλα', 'Hangman'), t('Κρεμάλα: τυχαία λέξη ή δική σου, με πάτημα στα γράμματα', 'Hangman: a random word or your own, tap the letters'))}
      ${tile('data-kid="dice"', '<b class="em">🎲</b>', t('Ζάρι', 'Dice'))}
      ${tile('data-kid="poll"', '<b class="em">📊</b>', t('Ψηφοφορία', 'Poll'), t('Ψηφοφορία της τάξης: Α Β Γ Δ ή ναι/όχι, με ραβδόγραμμα στο τέλος', 'Class poll: A B C D or yes/no, with a bar chart at the end'))}
      ${tile('data-kid="lottery"', '<b class="em">🎟️</b>', t('Κλήρωση', 'Random pick'), t('Κλήρωση: βγάζει τυχαίο μαθητή του τμήματος (ή αριθμό, αν το τμήμα δεν έχει ονόματα)', 'Random pick: draws a random student from the class (or a number, if the class has no names)'))}
    </div>
    <div class="gHead" data-lv="pri" data-tab="play">${t('Επιβράβευση', 'Rewards')}</div>
    <div class="tiles" data-lv="pri" data-tab="play">
      ${tile('data-kid="star"', '<b class="em">⭐</b>', t('Αστέρι', 'Star'))}
      ${tile('data-kid="smile"', '<b class="em">🙂</b>', t('Φατσούλα', 'Smiley'))}
      ${tile('data-kid="bravo"', '<b class="em">👏</b>', t('Μπράβο!', 'Well done!'))}
    </div>
    ${BETA ? `<div class="gHead" data-tab="play">${t('Τάξη', 'Classroom')}</div>
    <div class="tiles" data-tab="play">
      ${tile('data-gadget="voice"', '<b class="em">🤫</b>', t('Επίπεδο φωνής', 'Voice level'), t('Επίπεδο φωνής: ησυχία, ψίθυροι ή κανονική φωνή', 'Voice level: silence, whisper or normal voice'))}
      ${tile('data-gadget="noise"', '<b class="em">🎤</b>', t('Μετρητής θορύβου', 'Noise meter'), t('Μετρητής θορύβου με το μικρόφωνο· ο ήχος δεν ηχογραφείται', 'Noise meter using the microphone; sound is not recorded'))}
    </div>` : ''}
    <div class="gHead" data-tab="shape">${t('Παρουσίαση', 'Presentation')}</div>
    <div class="tiles" data-tab="shape">
      ${tile('data-gadget="timer" data-lv="sec"', I.timer, t('Χρονόμετρο', 'Timer'))}
      ${tile('data-view="curtainTop"', I.curtainTop, t('Κουρτίνα πάνω', 'Top curtain'), t('Κουρτίνα από πάνω (γράφεις και πάνω της)', 'Curtain from the top (you can write on it too)'))}
      ${tile('data-view="curtain"', I.curtain, t('Κουρτίνα κάτω', 'Bottom curtain'), t('Κουρτίνα από κάτω (γράφεις και πάνω της)', 'Curtain from the bottom (you can write on it too)'))}
      ${tile('data-view="spot"', I.spot, t('Προβολέας', 'Spotlight'))}
      ${tile('data-view="replay"', I.play, t('Αναπαρα&shy;γωγή', 'Re&shy;play'), t('Αναπαραγωγή της σελίδας', 'Replay the page'))}
    </div>
  </div>

  <div id="colorMenu" class="popup hidden">
    <div id="colorGrid"></div>
    <label id="colorPick"><i>${I.palette}</i>${t('Οποιοδήποτε χρώμα…', 'Any color…')}<input id="colorInput" type="color" value="#2563eb" /></label>
  </div>
  <div id="measOpts" class="popup hidden">
    <button data-meas="len">${t('Μήκη', 'Lengths')}</button>
    <button data-meas="ang">${t('Γωνίες', 'Angles')}</button>
    <button data-meas="area">${t('Εμβαδόν', 'Area')}</button>
    <button data-meas="per">${t('Περίμετρος', 'Perimeter')}</button>
  </div>
  <div id="measMenu" class="popup hidden">
    <div class="fnRow"><input id="measInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" /><button id="measOk">✓</button></div>
    <div id="measKeys"></div>
    <div class="hint">${t('Αριθμός: η πλευρά γίνεται τόσα cm (ή η γωνία τόσες μοίρες). Γράμμα ή μονάδα (α, θ, 5 m): αλλάζει μόνο η ετικέτα. Κενό: η πραγματική μέτρηση.', 'Number: the side becomes that many cm (or the angle that many degrees). Letter or unit (a, θ, 5 m): only the label changes. Empty: the actual measurement.')}</div>
  </div>
  <div id="labelMenu" class="popup hidden">
    <div id="labelGrid"></div>
    ${mi('id="labelOther"', I.keys, t('Άλλο…', 'Other…'))}
  </div>
  <div id="moveMenu" class="popup hidden">
    <div class="gHead">${t('Μεταφορά σε σελίδα', 'Move to page')}</div>
    <div id="moveGrid"></div>
  </div>
  <div id="scaleMenu" class="popup hidden">
    <div id="scaleGrid"></div>
  </div>
  <div id="fnMenu" class="popup hidden">
    <div id="fnHead"><b>${t('⠿ Συναρτήσεις', '⠿ Functions')}</b><button id="fnPts" class="pill" title="${t('Ρίζες, ακρότατα και σημεία τομής', 'Roots, extrema and intersection points')}">${t('• Σημεία', '• Points')}</button><button id="fnClose" title="${t('Κλείσιμο', 'Close')}">✕</button></div>
    <div id="fnList"></div>
    <div id="fnParams"></div>
    <div class="fnRow"><span>f(x) =</span><input id="fnInput" type="text" inputmode="none" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="x²-3x+2" /><button id="fnAdd">✓</button></div>
    <div id="fnErr" class="hint"></div>
    <div id="fnKeys"></div>
  </div>

  <div id="aiMenu" class="popup hidden">
    <b>${t('Αναγνώριση γραφής', 'Handwriting recognition')}</b>
    <div class="bgRow">
      <span>${t('Υπηρεσία', 'Service')}</span>
      <button data-prov="gemini" class="pill">Gemini</button>
      <button data-prov="claude" class="pill">Claude</button>
    </div>
    <label class="field">${t('Μοντέλο', 'Model')}<input id="aiModel" type="text" list="aiModels" autocomplete="off" spellcheck="false" /><datalist id="aiModels"></datalist></label>
    <label class="field">${t('Κλειδί API', 'API key')}<input id="aiKey" type="password" autocomplete="off" spellcheck="false" /></label>
    <div class="aiRow"><button id="aiSave">${t('✓ Αποθήκευση', '✓ Save')}</button><button id="aiForget">${t('Διαγραφή κλειδιού', 'Delete key')}</button></div>
    <div class="hint" id="aiHint"></div>
  </div>

  <div id="sendMenu" class="popup hidden">
    <b>${t('Αποστολή στους μαθητές', 'Send to students')}</b>
    <div id="sendSetup">
      <div class="hint">${t('Για να ανεβαίνει το μάθημα στο Google Drive και να βγαίνει QR, χρειάζεται μία φορά το «Client ID» από το Google Cloud του λογαριασμού σου. Μέχρι τότε μπορείς να κοινοποιείς το PDF με το κουμπί πιο κάτω.', 'To upload the lesson to Google Drive and get a QR code, you need a one-time “Client ID” from your Google Cloud account. Until then, you can share the PDF with the button below.')}</div>
      <label class="field">Client ID<input id="sendId" type="text" autocomplete="off" spellcheck="false" placeholder="….apps.googleusercontent.com" /></label>
      <div class="aiRow"><button id="sendIdSave" class="go">${t('Αποθήκευση', 'Save')}</button></div>
    </div>
    <div class="aiRow" id="sendActs">
      <button id="sendDrive" class="go">${t('Ανέβασμα στο Drive και QR', 'Upload to Drive and get QR')}</button>
      <button id="sendShare">${t('Κοινοποίηση του PDF', 'Share the PDF')}</button>
    </div>
    <div id="sendOut" class="hidden">
      <canvas id="sendQr" width="560" height="560"></canvas>
      <div id="sendUrl"></div>
      <div class="aiRow"><button id="sendCopy">${t('Αντιγραφή συνδέσμου', 'Copy link')}</button><button id="sendBig">${t('Μεγάλο QR', 'Large QR')}</button></div>
      <div class="hint" id="sendNote"></div>
    </div>
    <div class="aiRow"><button id="sendIdEdit">${t('Αλλαγή Client ID', 'Change Client ID')}</button><button id="sendClose">${t('Κλείσιμο', 'Close')}</button></div>
  </div>
  <div id="pagePick" class="hidden">
    <div id="ppBox">
      <b id="ppTitle"></b>
      <div id="ppQuick"><button id="ppAll">${t('Όλες', 'All')}</button><button id="ppNone">${t('Καμία', 'None')}</button><button id="ppCur">${t('Μόνο αυτή που βλέπω', 'Current page only')}</button></div>
      <div id="ppGrid"></div>
      <div id="ppActs"><button id="ppCancel">${t('Άκυρο', 'Cancel')}</button><button id="ppOk"></button></div>
    </div>
  </div>
  <div id="welcome" class="hidden">
    <div id="wBox">
      <div id="wHead"><img class="onDark" src="./logo-light.svg" alt="" /><img class="onLight" src="./logo.svg" alt="" /><div><b>${t('Καλώς ήρθες στο PrismaBoard', 'Welcome to PrismaBoard')}</b><span>${t('Τέσσερα πράγματα και ξεκινάς.', "Four things and you're ready to go.")}</span></div></div>
      <div id="wCards">
        <div><i>${PENCIL_ICON}</i><b>${t('Γράψε αμέσως', 'Start writing')}</b><span>${t('Το στυλό γράφει. Η παλάμη ή η γροθιά σβήνει. Δύο δάχτυλα μετακινούν και μεγεθύνουν.', 'The pen writes. Your palm or fist erases. Two fingers move and zoom.')}</span></div>
        <div><i>${I.ruler}</i><b>${t('Όργανα', 'Tools')}</b><span>${t('Σχήματα που μετριούνται, άξονες και συναρτήσεις, χάρακας, διαβήτης, κουρτίνα.', 'Measurable shapes, axes and functions, ruler, compass, curtain.')}</span></div>
        <div><i>${I.doc}</i><b>${t('Δεν χάνεται τίποτα', 'Nothing gets lost')}</b><span>${t('Ό,τι γράφεις αποθηκεύεται μόνο του. Τα μαθήματά σου είναι στο όνομα πάνω αριστερά.', 'Everything you write is saved automatically. Your lessons are under the name at the top left.')}</span></div>
        <div><i>${I.send}</i><b>${t('Στο τέλος, ένα QR', 'At the end, a QR code')}</b><span>${t('☰ → «Τέλος μαθήματος»: οι μαθητές σκανάρουν και παίρνουν το μάθημα σε PDF.', '☰ → “End of lesson”: students scan it and get the lesson as a PDF.')}</span></div>
      </div>
      <div id="wLevel"><span>${t('Για ποιες τάξεις;', 'Which grades?')}</span><button data-level="primary"><b>${t('Δημοτικό', 'Primary school')}</b><small>${t('Απλή γραμμή εργαλείων, αριθμογραμμή, κλάσματα, ρολόι, ζυγαριά', 'Simple toolbar, number line, fractions, clock, balance')}</small></button><button data-level="secondary"><b>${t('Γυμνάσιο – Λύκειο', 'Secondary school')}</b><small>${t('Συναρτήσεις, μετρήσεις, φυσική, λύση ασκήσεων', 'Functions, measurements, physics, solving exercises')}</small></button></div>
      <div id="wActs"><button id="wHelp">${t('Πλήρεις οδηγίες', 'Full guide')}</button><button id="wGo" class="go">${t('Ξεκίνα', 'Get started')}</button></div>
    </div>
  </div>
  <div id="qrBig" class="hidden"><img src="./logo.svg" alt="" /><canvas width="1200" height="1200"></canvas><div></div></div>

  <div id="replayBar" class="hidden">
    <span>${t('Αναπαραγωγή', 'Replay')}</span>
    <button data-rp="pause" title="${t('Παύση / συνέχεια', 'Pause / resume')}">⏸</button>
    <button data-rp="step" title="${t('Επόμενο βήμα', 'Next step')}">⏭</button>
    <button data-rp="stop" title="${t('Τέλος', 'End')}">✕</button>
  </div>
  <div id="textEd" class="hidden">
    <textarea rows="2" placeholder="${t('Γράψε εδώ…', 'Write here…')}"></textarea>
    <div class="row">
      <button id="textOk">${t('✓ Εντάξει', '✓ OK')}</button>
      <button id="textCancel">${t('✕ Άκυρο', '✕ Cancel')}</button>
    </div>
  </div>
  <div id="diag" class="hidden"></div>
  <div id="toast" class="hidden" role="status" aria-live="polite"></div>
  <div id="drop" class="hidden">${t('Άφησε το αρχείο εδώ (εικόνα, PDF ή Word)', 'Drop the file here (image, PDF or Word)')}</div>
  <input id="fileImport" type="file" accept="image/*,.png,.jpg,.jpeg,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple hidden />
  <input id="fileOpen" type="file" accept=".json,application/json" hidden />
`
  );
}
