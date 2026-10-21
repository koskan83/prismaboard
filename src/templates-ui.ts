/** Πρότυπα σελίδων: τα έτοιμα και όσα αποθηκεύει ο χρήστης από την τρέχουσα σελίδα. */

import { Item } from './model';
import { kvGet, kvSet } from './storage';
import { ask } from './dialog';
import { BUILTIN, type Template } from './pages';
import { $, board, esc, toast } from './app';
import { closePopups } from './main';
import { t } from './i18n';

let templates: Template[] = [];

export function renderTemplates(): void {
  $('tplList').innerHTML =
    BUILTIN.map((p, i) => `<div class="tplItem"${p.lv ? ` data-lv="${p.lv}"` : ''}><button data-tpl="b${i}">📄 ${esc(p.name)}</button></div>`).join('') +
    templates.map((p, i) => `<div class="tplItem"><button data-tpl="u${i}">📄 ${esc(p.name)}</button><button data-tpldel="${i}" title="${t('Διαγραφή προτύπου', 'Delete template')}">✕</button></div>`).join('');
}

export function initTemplates(): void {
  void kvGet<Template[]>('templates').then((v) => { templates = v ?? []; });
  $('tplMenu').addEventListener('click', async (e) => {
    const tg = e.target as HTMLElement;
    const del = tg.closest<HTMLElement>('[data-tpldel]');
    if (del) {
      templates.splice(Number(del.dataset.tpldel), 1);
      void kvSet('templates', templates);
      renderTemplates();
      return;
    }
    if (tg.closest('#tplSave')) {
      if (board.page.items.length === 0) {
        toast(t('Η σελίδα είναι κενή', 'The page is empty'));
        return;
      }
      const name = (await ask(t('Όνομα προτύπου', 'Template name'), { value: t(`Πρότυπο ${templates.length + 1}`, `Template ${templates.length + 1}`) }))?.trim();
      if (!name) return;
      templates.push({ name, items: JSON.parse(JSON.stringify(board.page.items)) as Item[] });
      void kvSet('templates', templates);
      renderTemplates();
      toast(t('Το πρότυπο αποθηκεύτηκε', 'Template saved'));
      return;
    }
    const b = tg.closest<HTMLElement>('[data-tpl]');
    if (!b) return;
    closePopups();
    const id = b.dataset.tpl!;
    const tpl = (id[0] === 'b' ? BUILTIN : templates)[Number(id.slice(1))];
    if (tpl) board.addPageWith(tpl.items);
  });
}
