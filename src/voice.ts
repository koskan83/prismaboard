import { t } from './i18n';
import { voiceArt } from './class-art';
import { loadVoice, saveVoice, type VoiceLevel } from './classroom';
import { dragByHeader, keepOnScreen } from './panel';

const NAMES = (): string[] => [t('Ησυχία', 'Silence'), t('Ψίθυροι', 'Whisper'), t('Κανονική φωνή', 'Normal voice')];
const LEVELS: VoiceLevel[] = [0, 1, 2];

/** Αιωρούμενο πάνελ «Επίπεδο φωνής»: ένα μεγάλο σχέδιο για το επιλεγμένο επίπεδο και δύο μικρά κουμπιά για τα άλλα. */
export class VoicePanel {
  private el: HTMLElement;
  private level: VoiceLevel = loadVoice() ?? 0;

  constructor(parent: HTMLElement) {
    parent.insertAdjacentHTML(
      'beforeend',
      `<div id="voice" class="cpanel hidden">
        <div class="thead"><span>${t('🤫 Επίπεδο φωνής', '🤫 Voice level')}</span><button data-v="close" title="${t('Κλείσιμο', 'Close')}">✕</button></div>
        <div class="vbody"></div>
      </div>`
    );
    this.el = parent.querySelector<HTMLElement>('#voice')!;
    this.el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button');
      if (!b) return;
      if (b.dataset.v === 'close') this.toggle();
      else if (b.dataset.lv !== undefined) this.select(Number(b.dataset.lv) as VoiceLevel);
    });
    dragByHeader(this.el, this.el.querySelector<HTMLElement>('.thead')!);
    this.render();
  }

  get visible(): boolean {
    return !this.el.classList.contains('hidden');
  }

  toggle(): void {
    this.el.classList.toggle('hidden');
    if (this.visible) keepOnScreen(this.el);
  }

  private select(l: VoiceLevel): void {
    this.level = l;
    saveVoice(l);
    this.render();
    window.dispatchEvent(new CustomEvent('voicechange', { detail: l }));
  }

  private render(): void {
    const names = NAMES();
    const small = LEVELS.filter((l) => l !== this.level)
      .map((l) => `<button class="vsmall" data-lv="${l}" title="${names[l]}" aria-label="${names[l]}">${voiceArt(l)}<small>${names[l]}</small></button>`)
      .join('');
    this.el.querySelector('.vbody')!.innerHTML =
      `<div class="vbig l${this.level}" role="img" aria-label="${names[this.level]}">${voiceArt(this.level)}<b>${names[this.level]}</b></div><div class="vrow">${small}</div>`;
  }
}
