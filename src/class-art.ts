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

// ---- Πρόσωπα σαν emoji (για το voiceArt). Τοπικές συντεταγμένες: κέντρο (0,0), ακτίνα 30. ----
const Y = '#ffcc4d';
const Y_D = '#f4a63a';
const Y_LINE = '#e69a2c';
const BR = '#5a3a0a';
const svgW = (body: string): string => `<svg viewBox="0 0 160 110" aria-hidden="true">${body}</svg>`;
const emoji = (cx: number, cy: number, r: number, rot: number, inner: string, flip = false): string =>
  `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${flip ? -r / 30 : r / 30} ${r / 30})">`
  + `<circle r="30" fill="${Y_D}"/><circle cy="-2.200" r="28" fill="${Y}"/>`
  + `<ellipse cx="-10" cy="-19" rx="9" ry="3.600" fill="#fff" opacity=".28" transform="rotate(-22 -10 -19)"/>${inner}</g>`;
const eye = (x: number, y: number, dx = 0, dy = 0): string =>
  `<ellipse cx="${x}" cy="${y}" rx="4.400" ry="5.600" fill="${BR}"/><circle cx="${x + 1.400 + dx}" cy="${y - 2 + dy}" r="1.600" fill="#fff"/>`;
const eyeWide = (x: number, y: number, dx = 0): string =>
  `<ellipse cx="${x}" cy="${y}" rx="7" ry="8" fill="#fff" stroke="${BR}" stroke-width="1.800"/><circle cx="${x + dx}" cy="${y + 1}" r="4" fill="${BR}"/><circle cx="${x + dx + 1.300}" cy="${y - .5}" r="1.400" fill="#fff"/>`;
const brow = (x1: number, y1: number, x2: number, y2: number): string =>
  `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 3} ${x2} ${y2}" fill="none" stroke="${BR}" stroke-width="2.600" stroke-linecap="round"/>`;
const talk = (): string =>
  `<path d="M-12 8C-6 6 6 6 12 8C12 21 -12 21 -12 8Z" fill="${BR}"/><path d="M-6 17.500Q0 12 6 17.500Q0 21 -6 17.500Z" fill="#ff7a8a"/>`
  + `<path d="M-11 8.500Q0 6.500 11 8.500Q0 11 -11 8.500Z" fill="#fff"/>`;
const hand = `fill="${Y}" stroke="${Y_LINE}" stroke-width="1.600" stroke-linejoin="round" stroke-linecap="round"`;

/** Εικόνα επιπέδου φωνής: 0 ησυχία (σσσς), 1 ψίθυροι, 2 κανονική φωνή. */
export function voiceArt(level: 0 | 1 | 2): string {
  if (level === 0) {
    return svgW(
      `<g fill="#6366f1" opacity=".18"><circle cx="22" cy="28" r="4"/><circle cx="140" cy="24" r="5"/><circle cx="134" cy="76" r="3"/></g>`
      + emoji(80, 54, 44, 0,
        brow(-16, -12, -5, -14) + brow(5, -14, 16, -12)
        + eye(-10, -4, 0, -.6) + eye(10, -4, 0, -.6)
        + `<path d="M-9 14.500Q0 12.500 9 14.500" fill="none" stroke="${BR}" stroke-width="2.600" stroke-linecap="round"/>`
        // δείκτης όρθιος πάνω στα χείλη, κλειστά δάχτυλα και αντίχειρας από κάτω
        + `<g ${hand}>`
        + `<ellipse cx="-9" cy="29" rx="5" ry="4" transform="rotate(-20 -9 29)"/>`
        + `<rect x="-10" y="22" width="25" height="15" rx="7"/>`
        + `<path d="M-1 26Q4 28 9 26M-1 31.500Q4 33.500 10 31.500" fill="none" opacity=".7"/>`
        + `<rect x="-4.500" y="2" width="9" height="30" rx="4.500"/>`
        + `<path d="M-3 7Q0 5 3 7" fill="none" opacity=".5"/>`
        + `</g>`)
    );
  }
  if (level === 1) {
    return svgW(
      `<g fill="#f59e0b" opacity=".2"><circle cx="18" cy="24" r="4"/><circle cx="142" cy="20" r="3"/></g>`
      // δεξί πρόσωπο: ωτίο και μάτια ορθάνοιχτα
      + emoji(118, 56, 28, 0,
        `<ellipse cx="-31" cy="2" rx="5" ry="7" fill="${Y_D}" stroke="${Y_LINE}" stroke-width="1.400"/>`
        + brow(-16, -17, -5, -19) + brow(5, -19, 16, -17)
        + eyeWide(-10, -6, -2) + eyeWide(10, -6, -2)
        + `<ellipse cx="0" cy="15" rx="3.400" ry="4" fill="${BR}"/>`)
      // αριστερό πρόσωπο, γερμένο προς τα δεξιά, μάτια στο πλάι
      + emoji(42, 58, 28, 14,
        eye(-8, -4, 1.600) + eye(12, -4, 1.600)
        + `<path d="M-14 -13Q-9 -16 -4 -14M7 -14Q12 -16 17 -13" fill="none" stroke="${BR}" stroke-width="2.400" stroke-linecap="round"/>`
        + `<path d="M-2 14Q4 16 10 13" fill="none" stroke="${BR}" stroke-width="2.600" stroke-linecap="round"/>`)
      // χέρι σε κοίλο σχήμα στο στόμα, δείχνει προς το ωτίο
      + `<g ${hand}><g transform="rotate(-10 70 72)">`
      + `<rect x="57" y="66" width="25" height="14" rx="7"/>`
      + `<path d="M68 67.500v5M74 67.500v5M79 68.500v4" fill="none" opacity=".7"/>`
      + `<ellipse cx="58" cy="65" rx="6" ry="3.400" transform="rotate(-25 58 65)"/>`
      + `</g></g>`
      + `<g fill="#38bdf8"><circle cx="80" cy="52" r="1.800" opacity=".7"/><circle cx="85" cy="46" r="1.500" opacity=".55"/><circle cx="91" cy="41" r="1.200" opacity=".4"/></g>`
    );
  }
  const bubble = (x: number, y: number, w: number, tailLeft: boolean, col: string): string =>
    `<g transform="translate(${x} ${y})"><path d="M6 0h${w - 12}a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H${tailLeft ? 20 : w - 8}l${tailLeft ? -5 : 5} 7v-7H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6Z" fill="#fff" stroke="${col}" stroke-width="2.200" stroke-linejoin="round"/>`
    + `<circle cx="${w / 2 - 7}" cy="11" r="2" fill="${col}"/><circle cx="${w / 2}" cy="11" r="2" fill="${col}"/><circle cx="${w / 2 + 7}" cy="11" r="2" fill="${col}"/></g>`;
  const arcs = (x: number, dir: 1 | -1, col: string): string =>
    [0, 1].map((i) => `<path d="M${x + dir * i * 6} ${72 - 7 - i * 3}q${dir * 5} ${7 + i * 3} 0 ${14 + i * 6}" fill="none" stroke="${col}" stroke-width="2.400" stroke-linecap="round" opacity="${.95 - i * .3}"/>`).join('');
  const faceTalk = (dx: number): string => brow(-16, -15, -5, -17) + brow(5, -17, 16, -15) + eye(-10 + dx, -5, dx / 2) + eye(10 + dx, -5, dx / 2) + `<g transform="translate(${dx * .6} 1)">${talk()}</g>`;
  const bow = `<g transform="translate(15 -26) rotate(25)"><path d="M0 0L-10 -6V6ZM0 0L10 -6V6Z" fill="#f472b6" stroke="#db2777" stroke-width="1.200" stroke-linejoin="round"/><circle r="3" fill="#ec4899" stroke="#db2777" stroke-width="1"/></g>`;
  return svgW(
    emoji(40, 72, 27, -6, faceTalk(3))
    + emoji(120, 72, 27, 6, faceTalk(-3) + bow)
    + bubble(10, 4, 40, true, '#38bdf8')
    + bubble(110, 4, 40, false, '#f472b6')
    + arcs(70, 1, '#38bdf8') + arcs(90, -1, '#f472b6')
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
