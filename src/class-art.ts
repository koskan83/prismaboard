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

/** Εικόνα επιπέδου φωνής: 0 ησυχία (σσσς), 1 ψίθυροι, 2 κανονική φωνή. */
export function voiceArt(level: 0 | 1 | 2): string {
  if (level === 0) {
    return svg(
      head() + eyesShut()
      // χείλη κλειστά
      + `<path d="M49 81q11 4 22 0" fill="none" stroke="#d9667a" stroke-width="4" stroke-linecap="round"/>`
      // ο δείκτης όρθιος πάνω στα χείλη, με τη γροθιά κάτω από το πηγούνι
      + `<g stroke="${SKIN_D}" stroke-width="2.200" stroke-linejoin="round">`
      + `<rect x="46" y="94" width="28" height="20" rx="9" fill="${SKIN}"/>`
      + `<path d="M53 100v8M60 100v8M67 100v8" fill="none" stroke-linecap="round" opacity=".7"/>`
      + `<rect x="55" y="68" width="10" height="34" rx="5" fill="${SKIN}"/>`
      + `<rect x="57" y="70" width="6" height="6" rx="3" fill="#fde7cf" stroke="none"/>`
      + `</g>`
      + `<g fill="#6366f1" font-family="system-ui,sans-serif" font-weight="800"><text x="88" y="34" font-size="17">z</text><text x="97" y="22" font-size="13">z</text><text x="104" y="13" font-size="10">z</text></g>`
    );
  }
  if (level === 1) {
    return svg(
      head() + eyes()
      // στόμα μικρό, σουφρωμένο προς το χέρι
      + `<ellipse cx="66" cy="81" rx="3.200" ry="2.800" fill="#b4485a"/>`
      // παλάμη όρθια στην άκρη του στόματος (δάχτυλα ενωμένα προς τα πάνω, αντίχειρας προς τα χείλη), λίγο γερμένη προς το πρόσωπο
      + `<g transform="rotate(-10 82 86)" stroke="#d98f55" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="#f5b985">`
      + `<rect x="75" y="66" width="17" height="30" rx="7"/>`
      + `<path d="M79.500 67v10M83.500 66v11M87.500 67v10" fill="none" stroke-width="1.600" opacity=".75"/>`
      + `<ellipse cx="74" cy="88" rx="4" ry="6.500" transform="rotate(-25 74 88)"/>`
      + `</g>`
      // ψίθυρος: λίγα αχνά τελάκια που φεύγουν από πάνω
      + `<g fill="#38bdf8" opacity=".75"><circle cx="99" cy="70" r="2.200"/><circle cx="104" cy="64" r="1.800"/><circle cx="108" cy="58" r="1.400"/></g>`
    );
  }
  return svg(
    head() + eyes()
    + `<ellipse cx="60" cy="81" rx="9" ry="7" fill="#7f1d1d"/><ellipse cx="60" cy="85" rx="5.500" ry="3" fill="#f87171"/>`
    // φούσκα ομιλίας και κύματα
    + `<g transform="translate(0 3)"><path d="M78 9h26a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H92l-9 8v-8h-5a6 6 0 0 1-6-6V15a6 6 0 0 1 6-6Z" fill="#fff" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round"/>`
    + `<circle cx="82" cy="22" r="2.600" fill="#38bdf8"/><circle cx="91" cy="22" r="2.600" fill="#38bdf8"/><circle cx="100" cy="22" r="2.600" fill="#38bdf8"/></g>`
    + waves(96, 86, 3, 0.9, '#38bdf8', 4.5, 3)
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
