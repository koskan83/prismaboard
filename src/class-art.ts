/** Σχέδια SVG (επίπεδα, χρωματιστά) για τα εργαλεία τάξης: επίπεδα φωνής και πρόσωπα του μετρητή θορύβου. */

const SKIN = '#fcd5a5';
const SKIN_D = '#e9a96b';
const HAIR = '#7c4a2d';
const INK = '#3b2a20';

const eyes = (): string => `<circle cx="48" cy="62" r="4" fill="${INK}"/><circle cx="72" cy="62" r="4" fill="${INK}"/>`
  + `<circle cx="49.500" cy="60.500" r="1.400" fill="#fff"/><circle cx="73.500" cy="60.500" r="1.400" fill="#fff"/>`;
/** Το κέντρο του κεφαλιού (60,60) είναι και κέντρο του viewBox, ώστε το πρόσωπο να είναι πάντα στη μέση. */
const svg = (body: string): string => `<svg viewBox="8 8 104 104" aria-hidden="true">${body}</svg>`;

/** Φαρδύ πλαίσιο για τα επίπεδα φωνής, με το ηχείο και τα κύματα στη μέση και περιθώριο γύρω. */
const svgW = (body: string): string => `<svg viewBox="0 0 160 110" aria-hidden="true"><g transform="translate(18 10) scale(.82)">${body}</g></svg>`;
/** Ηχείο (σε viewBox 160 × 110) στο χρώμα του επιπέδου. */
const speaker = (col: string): string =>
  `<path d="M22 40h18l26-22v74L40 70H22a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6Z" fill="${col}" stroke="${col}" stroke-width="6" stroke-linejoin="round"/>`;
/** Κυματάκια ήχου μπροστά από το ηχείο: n τόξα, όλο και μεγαλύτερα. */
const arcs = (n: number, col: string): string => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const r = 16 + i * 17;
    s += `<path d="M${78 + i * 4} ${55 - r}a${r} ${r} 0 0 1 0 ${2 * r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`;
  }
  return s;
};

/** Εικόνα επιπέδου φωνής: ηχείο χωρίς ήχο (ησυχία), με ένα κυματάκι (ψίθυροι), με τρία (κανονική φωνή). */
export function voiceArt(level: 0 | 1 | 2): string {
  if (level === 0) {
    return svgW(speaker('#6366f1')
      + `<path d="M92 36l38 38M130 36l-38 38" stroke="#ef4444" stroke-width="11" stroke-linecap="round"/>`);
  }
  if (level === 1) return svgW(speaker('#f59e0b') + arcs(1, '#f59e0b'));
  return svgW(speaker('#16a34a') + arcs(3, '#16a34a'));
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
