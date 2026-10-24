/** Το παράθυρο «Τιμές» για κάθε σχήμα με δεδομένα: από το κουμπί «Τιμές» ή πατώντας πάνω στο πλαίσιο των τιμών κάτω από το σχήμα. */

import type { StampItem } from './model';
import { ask } from './dialog';
import { board } from './app';
import { stampSim } from './sim-def';

/** Τα δεδομένα του σχήματος σε πλαίσιο κειμένου, με το παράδειγμα του σχήματος από κάτω. */
export async function editSim(sp: StampItem): Promise<void> {
  const def = stampSim(sp.name);
  if (!def) return;
  const v = await ask(def.title, { value: def.text(sp.sim ?? {}), hint: def.hint(), max: 80 });
  // το σχήμα μπορεί να έχει αλλάξει (ή να σβήστηκε) όσο ήταν ανοιχτό το παράθυρο
  if (v !== null && board.selectedSim?.id === sp.id) board.setSim(v);
}

board.onSimRequest = (sp) => void editSim(sp);
// μόνο στη beta
document.getElementById('spSim')?.addEventListener('click', () => {
  const sp = board.selectedSim;
  if (sp) void editSim(sp);
});
