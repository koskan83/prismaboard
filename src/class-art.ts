/** Σχέδια SVG (επίπεδα, χρωματιστά) για τα εργαλεία τάξης: επίπεδα φωνής και πρόσωπα του μετρητή θορύβου. */

const SKIN = '#fcd5a5';
const SKIN_D = '#e9a96b';
const HAIR = '#7c4a2d';
const INK = '#3b2a20';

/** Κεφάλι παιδιού: μαλλιά, αυτιά, μάγουλα (μέσα σε viewBox 0 0 120 120). */
const head = (cheek = '#f9a8a8'): string =>
  `<circle cx="26" cy="64" r="7" fill="${SKIN_D}"/><circle cx="94" cy="64" r="7" fill="${SKIN_D}"/>`
  + `<circle cx="60" cy="62" r="34" fill="${SKIN}"/>`
  + `<path d="M26 58C24 30 44 22 62 24C82 24 96 36 94 58C86 48 78 42 60 42C44 42 34 48 26 58Z" fill="${HAIR}"/>`
  + `<circle cx="42" cy="72" r="6" fill="${cheek}" opacity=".7"/><circle cx="78" cy="72" r="6" fill="${cheek}" opacity=".7"/>`;
const eyes = (): string => `<circle cx="48" cy="62" r="4" fill="${INK}"/><circle cx="72" cy="62" r="4" fill="${INK}"/>`
  + `<circle cx="49.500" cy="60.500" r="1.400" fill="#fff"/><circle cx="73.500" cy="60.500" r="1.400" fill="#fff"/>`;
const eyesShut = (): string => `<path d="M43 63q5 5 10 0M67 63q5 5 10 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
const waves = (x: number, y: number, n: number, op: number, col = '#38bdf8', step = 6, w = 3.500): string => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const r = 5 + i * step;
    s += `<path d="M${x + r * 0.4} ${y - r}a${r * 1.1} ${r * 1.1} 0 0 1 0 ${2 * r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  }
  return s;
};
/** Το κέντρο του κεφαλιού (60,60) είναι και κέντρο του viewBox, ώστε το πρόσωπο να είναι πάντα στη μέση. */
const svg = (body: string): string => `<svg viewBox="8 8 104 104" aria-hidden="true">${body}</svg>`;

// ---- Παιδιά σε προφίλ (για το voiceArt). Σχεδιάζονται κοιτάζοντας δεξιά γύρω από το (0,0)· για αριστερά καθρεφτίζονται. ----
interface Kid { skin: string; skinD: string; hair: string; shirt: string; girl?: boolean; mouth: 'shut' | 'open' | 'o'; eye: 'shut' | 'open' | 'wide' }
const FACE = 'M0 -27C18 -27 27 -15 27 -4L27 0C28 3 33 7 33 10C33 12 30 13 27 13L28 16C29 17 28 18 26 18.500C28 19 28 22 26 23C26 25 26 27 25 29C22 32 14 33 6 31L-8 30C-22 28 -27 14 -27 0C-27 -16 -14 -27 0 -27Z';
const kidBack = (k: Kid): string => k.girl
  ? `<ellipse cx="-31" cy="14" rx="9" ry="22" transform="rotate(16 -31 14)" fill="${k.hair}"/><circle cx="-36" cy="34" r="6" fill="${k.hair}"/>`
  : '';
const kidBody = (k: Kid): string =>
  `<path d="M-10 24h20v18h-20Z" fill="${k.skinD}"/>`
  + `<path d="M-40 90C-40 52 -24 40 -2 40C16 40 32 46 40 62L46 90Z" fill="${k.shirt}"/>`
  + `<path d="M-8 40q10 10 20 0" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`;
const kidHead = (k: Kid): string => {
  const eye = k.eye === 'shut' ? `<path d="M12 -3q4 4 9 0" fill="none" stroke="${INK}" stroke-width="2.600" stroke-linecap="round"/>`
    : k.eye === 'wide' ? `<ellipse cx="17" cy="-3" rx="4.400" ry="5" fill="#fff"/><circle cx="18.500" cy="-3" r="2.600" fill="${INK}"/>`
    : `<ellipse cx="17" cy="-3" rx="3" ry="3.600" fill="${INK}"/><circle cx="18" cy="-4.200" r="1.100" fill="#fff"/>`;
  const brow = `<path d="M12 -11q5-3 11-1" fill="none" stroke="${k.hair}" stroke-width="2.200" stroke-linecap="round"/>`;
  const mouth = k.mouth === 'open'
    ? `<path d="M26 15.500C32 16 33 22 26 23.500C21 24 17 22 17 19.500C17 17 21 15 26 15.500Z" fill="#8f2a3a"/><path d="M20 22q4 2.500 7 0" fill="none" stroke="#f47c8c" stroke-width="2.400" stroke-linecap="round"/>`
    : k.mouth === 'o' ? `<ellipse cx="26" cy="19.500" rx="3" ry="3.400" fill="#8f2a3a"/>`
    : `<path d="M20 19.500q3 1.800 7 0" fill="none" stroke="#d9667a" stroke-width="2.600" stroke-linecap="round"/>`;
  const hair = k.girl
    ? `<path d="M27 -8C27 -25 14 -31 0 -31C-19 -31 -31 -18 -30 2C-30 10 -27 14 -23 16L-17 4C-14 -6 -2 -11 8 -13C16 -14 23 -11 27 -8Z" fill="${k.hair}"/>`
    : `<path d="M28 -9C28 -25 15 -31 1 -31C-18 -31 -30 -19 -29 -2C-29 4 -27 8 -24 10L-18 -2C-12 -9 0 -12 8 -14C16 -15 24 -13 28 -9Z" fill="${k.hair}"/>`;
  return `<path d="${FACE}" fill="${k.skin}"/>`
    + `<ellipse cx="-5" cy="6" rx="5.500" ry="7" fill="${k.skinD}"/><ellipse cx="-5" cy="6.500" rx="2.600" ry="4" fill="${k.skin}" opacity=".8"/>`
    + hair + brow + eye
    + `<circle cx="13" cy="12" r="5.500" fill="#f9a8a8" opacity=".65"/>`
    + mouth;
};
const kid = (k: Kid, x: number, y: number, sc: number, flip = false): string =>
  `<g transform="translate(${x} ${y}) scale(${flip ? -sc : sc} ${sc})">${kidBack(k)}${kidBody(k)}${kidHead(k)}</g>`;
const svgW = (body: string): string => `<svg viewBox="0 0 160 110" aria-hidden="true">${body}</svg>`;

const KID_A: Kid = { skin: '#fcd5a5', skinD: '#e9a96b', hair: '#7c4a2d', shirt: '#6366f1', mouth: 'shut', eye: 'shut' };
const KID_B: Kid = { skin: '#c98e5f', skinD: '#a86f45', hair: '#2f1d14', shirt: '#f59e0b', mouth: 'o', eye: 'wide' };
const BOY: Kid = { skin: '#f6c99a', skinD: '#e0a36c', hair: '#b45f2a', shirt: '#38bdf8', mouth: 'open', eye: 'open' };
const GIRL: Kid = { skin: '#e3b184', skinD: '#c98f60', hair: '#4a2a1a', shirt: '#f472b6', girl: true, mouth: 'open', eye: 'open' };

/** Εικόνα επιπέδου φωνής: 0 ησυχία (σσσς), 1 ψίθυροι, 2 κανονική φωνή. */
export function voiceArt(level: 0 | 1 | 2): string {
  if (level === 0) {
    return svgW(
      `<g fill="#6366f1" opacity=".18"><circle cx="30" cy="30" r="3"/><circle cx="128" cy="26" r="4"/><circle cx="122" cy="60" r="2.500"/></g>`
      + kid(KID_A, 76, 42, 1.050)
      // δείκτης όρθιος μπροστά στα χείλη, γροθιά κάτω από το πηγούνι, βραχίονας από κάτω
      + `<g stroke="#e9a96b" stroke-width="1.800" stroke-linejoin="round" stroke-linecap="round" fill="#fcd5a5">`
      + `<path d="M96 110L84 82" stroke="#6366f1" stroke-width="15" fill="none"/>`
      + `<path d="M96 110L84 82" stroke="#6366f1" stroke-width="12" fill="none"/>`
      + `<rect x="82" y="73" width="24" height="18" rx="8"/>`
      + `<path d="M88 79v6M94 79v6M100 79v6" fill="none" opacity=".6"/>`
      + `<rect x="98.500" y="56" width="8.500" height="31" rx="4.250"/>`
      + `<ellipse cx="85" cy="82" rx="3.500" ry="6" transform="rotate(-30 85 82)"/>`
      + `</g>`
    );
  }
  if (level === 1) {
    return svgW(
      `<g fill="#f59e0b" opacity=".2"><circle cx="24" cy="26" r="4"/><circle cx="140" cy="22" r="3"/></g>`
      + kid(KID_B, 108, 46, .72)
      + kid({ ...KID_A, eye: 'open', mouth: 'o', shirt: '#22c55e' }, 50, 50, .72)
      // χέρι σε κοίλο σχήμα ανάμεσα στο στόμα και στο αυτί
      + `<g stroke="#e9a96b" stroke-width="1.600" stroke-linejoin="round" stroke-linecap="round" fill="#fcd5a5">`
      + `<path d="M74 66L68 84" stroke="#fcd5a5" stroke-width="8" fill="none"/>`
      + `<path d="M68 82L62 104" stroke="#22c55e" stroke-width="12" fill="none"/>`
      + `<g transform="rotate(-24 82 58)"><rect x="70" y="50" width="26" height="15" rx="7.500"/>`
      + `<path d="M80 51.500v5M86 51.500v5M92 52.500v5" fill="none" opacity=".6"/><ellipse cx="73" cy="64" rx="5" ry="3.400"/></g>`
      + `</g>`
      + `<g fill="#38bdf8" opacity=".6"><circle cx="74" cy="72" r="1.600"/><circle cx="80" cy="73" r="1.300"/><circle cx="85" cy="71" r="1"/></g>`
    );
  }
  const bubble = (x: number, y: number, w: number, flip: boolean, col: string): string =>
    `<g transform="translate(${x} ${y})"><path d="${flip ? 'M6 0h' + (w - 6) + 'a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H' + (w - 6) + 'l-6 7v-7H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6Z' : 'M6 0h' + (w - 6) + 'a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H14l-6 7v-7H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6Z'}" fill="#fff" stroke="${col}" stroke-width="2.200" stroke-linejoin="round"/>`
    + `<circle cx="${w / 2 - 6}" cy="11" r="2" fill="${col}"/><circle cx="${w / 2 + 1}" cy="11" r="2" fill="${col}"/><circle cx="${w / 2 + 8}" cy="11" r="2" fill="${col}"/></g>`;
  const arcs = (x: number, dir: 1 | -1, col: string): string =>
    [0, 1].map((i) => `<path d="M${x + dir * i * 5} ${60 - 6 - i * 3}q${dir * 5} ${6 + i * 3} 0 ${12 + i * 6}" fill="none" stroke="${col}" stroke-width="2.200" stroke-linecap="round" opacity="${.9 - i * .25}"/>`).join('');
  return svgW(
    kid(BOY, 43, 52, .7)
    + kid(GIRL, 117, 52, .7, true)
    + bubble(18, 4, 38, false, '#38bdf8')
    + bubble(104, 8, 36, true, '#f472b6')
    + arcs(72, 1, '#38bdf8') + arcs(88, -1, '#f472b6')
  );
}

/** Πρόσωπο του μετρητή θορύβου: 0 ήρεμο, 1 ανήσυχο, 2 αναστατωμένο. */
export function noiseFace(zone: 0 | 1 | 2): string {
  const col = zone === 2 ? '#fca5a5' : zone === 1 ? '#fde68a' : SKIN;
  const base = `<circle cx="26" cy="64" r="7" fill="${SKIN_D}"/><circle cx="94" cy="64" r="7" fill="${SKIN_D}"/><circle cx="60" cy="62" r="34" fill="${col}"/>`
    + `<path d="M26 58C24 30 44 22 62 24C82 24 96 36 94 58C86 48 78 42 60 42C44 42 34 48 26 58Z" fill="${HAIR}"/>`;
  if (zone === 0) {
    return svg(base + `<circle cx="42" cy="72" r="6" fill="#f9a8a8" opacity=".7"/><circle cx="78" cy="72" r="6" fill="#f9a8a8" opacity=".7"/>` + eyes()
      + `<path d="M46 78q14 14 28 0" fill="none" stroke="${INK}" stroke-width="3.500" stroke-linecap="round"/>`);
  }
  if (zone === 1) {
    return svg(base + eyes()
      + `<path d="M40 53l12-4M80 53l-12-4" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M50 85q10-6 20 0" fill="none" stroke="${INK}" stroke-width="3.500" stroke-linecap="round"/>`
      + `<path d="M100 36c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15Z" fill="#38bdf8"/>`);
  }
  return svg(base
    + `<circle cx="48" cy="64" r="4" fill="${INK}"/><circle cx="72" cy="64" r="4" fill="${INK}"/>`
    + `<path d="M38 52l17 6M82 52l-17 6" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
    + `<ellipse cx="60" cy="86" rx="10" ry="7" fill="#7f1d1d"/><path d="M52 83h16" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M100 20l-6 10h8l-6 10M18 22l5 8-7 2 5 8" fill="none" stroke="#ef4444" stroke-width="3.500" stroke-linecap="round" stroke-linejoin="round"/>`);
}
