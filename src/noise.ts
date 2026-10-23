import { t } from './i18n';
import { toast } from './app';
import { noiseFace } from './class-art';
import { DEFAULT_LIMIT, clamp, limitForVoice, loadLimit, loadVoice, rmsToLevel, saveLimit, smooth, zoneOf, type VoiceLevel } from './classroom';
import { dragByHeader, keepOnScreen, resizable } from './panel';

/** Πόση ώρα πάνω από το όριο πριν αναβοσβήσει κόκκινο το πάνελ. */
const ALARM_MS = 1500;

/** Αιωρούμενος μετρητής θορύβου: μικρόφωνο → στάθμη 0..100, πρόσωπο που αλλάζει και ρυθμιζόμενο όριο. Ο ήχος δεν αποθηκεύεται ούτε στέλνεται πουθενά. */
export class NoisePanel {
  private el: HTMLElement;
  private bar: HTMLElement;
  private fill: HTMLElement;
  private lim: HTMLElement;
  private face: HTMLElement;
  private num: HTMLElement;
  private limit = loadLimit() ?? limitForVoice(loadVoice()) ?? DEFAULT_LIMIT;
  private level = 0;
  private zone: 0 | 1 | 2 = 0;
  private over = 0;
  private ac: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private timer = 0;
  private starting = 0;

  constructor(parent: HTMLElement) {
    parent.insertAdjacentHTML(
      'beforeend',
      `<div id="noise" class="cpanel hidden">
        <div class="thead"><span>${t('🎤 Μετρητής θορύβου', '🎤 Noise meter')}</span><button data-n="close" title="${t('Κλείσιμο', 'Close')}">✕</button></div>
        <div class="nbody">
          <div class="nbar"><div class="nfill"></div><div class="nlim" title="${t('Όριο θορύβου: σύρε το', 'Noise limit: drag it')}"></div></div>
          <div class="nside"><div class="nface"></div><div class="nnum">0</div>
            <div class="nlimit"><button data-n="down" aria-label="${t('Χαμηλότερο όριο', 'Lower limit')}">−</button><span>${t('Όριο', 'Limit')}</span><button data-n="up" aria-label="${t('Υψηλότερο όριο', 'Higher limit')}">+</button></div>
          </div>
        </div>
        <p class="nnote">${t('Ο ήχος επεξεργάζεται μόνο στη συσκευή· δεν ηχογραφείται ούτε στέλνεται πουθενά.', 'Sound is processed on this device only; it is never recorded or sent anywhere.')}</p>
      </div>`
    );
    this.el = parent.querySelector<HTMLElement>('#noise')!;
    this.bar = this.el.querySelector<HTMLElement>('.nbar')!;
    this.fill = this.el.querySelector<HTMLElement>('.nfill')!;
    this.lim = this.el.querySelector<HTMLElement>('.nlim')!;
    this.face = this.el.querySelector<HTMLElement>('.nface')!;
    this.num = this.el.querySelector<HTMLElement>('.nnum')!;
    this.el.addEventListener('click', (e) => {
      const n = (e.target as HTMLElement).closest<HTMLElement>('button')?.dataset.n;
      if (n === 'close') this.toggle();
      else if (n === 'up' || n === 'down') this.setLimit(this.limit + (n === 'up' ? 5 : -5));
    });
    this.bindLimitDrag();
    dragByHeader(this.el, this.el.querySelector<HTMLElement>('.thead')!);
    resizable(this.el, 'grafida.size.noise');
    // όταν διαλέγεται επίπεδο φωνής, το όριο ακολουθεί (ο δάσκαλος μπορεί να το αλλάξει μετά)
    window.addEventListener('voicechange', (e) => this.setLimit(limitForVoice((e as CustomEvent<VoiceLevel>).detail)));
    document.addEventListener('visibilitychange', () => document.hidden && this.close());
    this.paint();
  }

  get visible(): boolean {
    return !this.el.classList.contains('hidden');
  }

  toggle(): void {
    if (this.visible) this.close();
    else void this.open();
  }

  private async open(): Promise<void> {
    const md = navigator.mediaDevices;
    if (!md?.getUserMedia) {
      toast(t('Αυτή η συσκευή δεν δίνει πρόσβαση στο μικρόφωνο', 'This device does not give access to the microphone'));
      return;
    }
    const id = ++this.starting;
    this.el.classList.remove('hidden');
    keepOnScreen(this.el);
    // το AudioContext φτιάχνεται μέσα στο πάτημα, πριν από το παράθυρο της άδειας: αλλιώς μπορεί να μείνει «suspended» και ο μετρητής στο 0
    const ac = new AudioContext();
    ac.resume().catch(() => {});
    try {
      const stream = await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      if (id !== this.starting || !this.visible) {
        stream.getTracks().forEach((tr) => tr.stop());
        void ac.close().catch(() => {});
        return;
      }
      this.stream = stream;
      this.ac = ac;
      if (ac.state === 'suspended') this.el.addEventListener('pointerdown', () => void ac.resume().catch(() => {}), { once: true });
      const an = this.ac.createAnalyser();
      an.fftSize = 1024;
      this.ac.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      this.level = 0;
      this.over = 0;
      this.timer = window.setInterval(() => {
        an.getFloatTimeDomainData(buf);
        let s = 0;
        for (const v of buf) s += v * v;
        this.step(rmsToLevel(Math.sqrt(s / buf.length)), 50);
      }, 50);
    } catch (e) {
      if (this.ac !== ac) void ac.close().catch(() => {});
      if (id !== this.starting) return;
      this.close();
      const name = (e as DOMException)?.name;
      toast(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? t('Χρειάζεται άδεια για το μικρόφωνο, για να μετρήσω τον θόρυβο', 'Microphone permission is needed to measure the noise')
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? t('Δεν βρέθηκε μικρόφωνο σε αυτή τη συσκευή', 'No microphone was found on this device')
            : t('Το μικρόφωνο δεν ανοίγει: μήπως το χρησιμοποιεί άλλο πρόγραμμα;', 'The microphone will not open: is another program using it?'),
        4500
      );
    }
  }

  private close(): void {
    this.starting++;
    clearInterval(this.timer);
    this.stream?.getTracks().forEach((tr) => tr.stop());
    this.stream = null;
    void this.ac?.close().catch(() => {});
    this.ac = null;
    this.el.classList.add('hidden');
    this.el.classList.remove('alarm');
    this.over = 0;
  }

  private step(raw: number, dt: number): void {
    this.level = smooth(this.level, raw);
    this.over = this.level >= this.limit ? this.over + dt : 0;
    this.el.classList.toggle('alarm', this.over >= ALARM_MS);
    this.paint();
  }

  private setLimit(n: number): void {
    this.limit = clamp(n, 5, 95);
    saveLimit(this.limit);
    this.paint();
  }

  private paint(): void {
    const z = zoneOf(this.level, this.limit);
    this.fill.style.height = this.level + '%';
    this.lim.style.bottom = this.limit + '%';
    this.bar.style.setProperty('--lim', this.limit + '%');
    this.bar.style.setProperty('--amb', this.limit * 0.7 + '%');
    this.num.textContent = String(Math.round(this.level));
    if (z !== this.zone || !this.face.firstChild) {
      this.zone = z;
      this.face.innerHTML = noiseFace(z);
    }
  }

  /** Το όριο σύρεται πάνω στη μπάρα (ή με ένα πάτημα εκεί που θες). */
  private bindLimitDrag(): void {
    let on = false;
    const set = (e: PointerEvent) => {
      const r = this.bar.getBoundingClientRect();
      this.setLimit(((r.bottom - e.clientY) / r.height) * 100);
    };
    this.bar.addEventListener('pointerdown', (e) => {
      on = true;
      this.bar.setPointerCapture(e.pointerId);
      set(e);
    });
    this.bar.addEventListener('pointermove', (e) => on && set(e));
    const end = () => (on = false);
    this.bar.addEventListener('pointerup', end);
    this.bar.addEventListener('pointercancel', end);
  }
}
