/** Κείμενο από σελίδες PDF/Word: κομμάτια με τη θέση τους γίνονται γραμμές, που μπαίνουν στον πίνακα ως κείμενα που διορθώνονται. */

/** Κομμάτι κειμένου (λέξη ή φράση) σε pixel της εικόνας της σελίδας: πάνω αριστερή γωνία, πλάτος και ύψος γραμμάτων. */
export interface Run {
  x: number;
  top: number;
  w: number;
  h: number;
  str: string;
}

/** Μια γραμμή (ή κομμάτι γραμμής, αν τη χωρίζει μεγάλο κενό, π.χ. στήλες ή κελιά πίνακα). */
export interface Line {
  x: number;
  top: number;
  w: number;
  h: number;
  text: string;
}

/**
 * Ενώνει τα κομμάτια σε γραμμές: πρώτα σε σειρές με περίπου ίδιο ύψος, μετά από αριστερά προς τα δεξιά.
 * Μικρό κενό ανάμεσα σε δύο κομμάτια γίνεται διάστημα· κενό πάνω από 2,5 φορές το ύψος των γραμμάτων ξεκινά νέα γραμμή.
 */
export function runsToLines(runs: Run[]): Line[] {
  const sorted = runs.filter((r) => r.str.trim() && r.h > 0).sort((a, b) => a.top - b.top);
  const rows: Run[][] = [];
  for (const r of sorted) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(r.top - row[0].top) < 0.5 * Math.min(r.h, row[0].h)) row.push(r);
    else rows.push([r]);
  }
  const out: Line[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    let cur: Line | null = null;
    for (const r of row) {
      const end = cur ? cur.x + cur.w : 0;
      const gap = r.x - end;
      if (cur && gap < 2.5 * Math.max(r.h, cur.h)) {
        // διάστημα όταν υπάρχει ορατό κενό και δεν το έχει ήδη κάποιο από τα δύο κομμάτια
        const space = gap > 0.12 * r.h && !/\s$/.test(cur.text) && !/^\s/.test(r.str) ? ' ' : '';
        cur.text += space + r.str;
        cur.top = Math.min(cur.top, r.top);
        cur.h = Math.max(cur.h, r.h);
        cur.w = Math.max(end, r.x + r.w) - cur.x;
      } else {
        cur = { x: r.x, top: r.top, w: r.w, h: r.h, text: r.str };
        out.push(cur);
      }
    }
  }
  for (const l of out) l.text = l.text.replace(/\s+/g, ' ').trim();
  return out.filter((l) => l.text);
}
