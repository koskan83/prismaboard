import { Page, TextItem, textFont, uid } from './model';
import { t } from './i18n';
import { BETA } from './beta';
import { Run, runsToLines } from './doc-text';

/** Οι σελίδες PDF/Word μπαίνουν ως «χαρτί» (βλ. Pic.paper)· προς το παρόν μόνο στη beta. */
const PAPER = BETA || undefined;

/**
 * Σελίδα του πίνακα, πλάτους 1000, από την εικόνα μιας σελίδας. Με `runs` το κείμενο σβήνεται από την εικόνα
 * και μπαίνει από πάνω της ως κείμενα που διορθώνονται· η εικόνα μένει ως «χαρτί» για σχήματα, φωτογραφίες και τύπους.
 */
function toPage(cv: HTMLCanvasElement, quality: number, runs?: Run[]): Page {
  const k = 1000 / cv.width;
  const pic = uid();
  const texts: TextItem[] = [];
  if (runs) {
    const c = cv.getContext('2d')!;
    c.fillStyle = '#ffffff';
    for (const r of runs) c.fillRect(r.x - 1, r.top - 0.1 * r.h, r.w + 2, 1.35 * r.h);
    const m = document.createElement('canvas').getContext('2d')!;
    for (const l of runsToLines(runs)) {
      let size = l.h * k;
      m.font = textFont(size);
      // η γραμματοσειρά του πίνακα είναι συνήθως φαρδύτερη: μικραίνει λίγο, ώστε η γραμμή να χωρά εκεί που ήταν
      const w = m.measureText(l.text).width;
      if (w > l.w * k) size *= Math.max(0.7, (l.w * k) / w);
      texts.push({ kind: 'text', id: uid(), x: l.x * k, y: l.top * k, text: l.text, size: Math.round(size * 10) / 10, color: '#111111', on: pic });
    }
  }
  return {
    view: { x: 0, y: 0, k: 1 },
    items: [{ kind: 'image', id: pic, x: 0, y: 0, w: 1000, h: (1000 * cv.height) / cv.width, src: cv.toDataURL('image/jpeg', quality), paper: runs ? true : PAPER }, ...texts],
  };
}

/** Οι λέξεις μιας σελίδας του Word όπως τις στοίχισε ο browser, σε pixel της εικόνας της (κλίμακα `scale`). Οι τύποι μένουν στην εικόνα. */
function domRuns(sec: HTMLElement, scale: number): Run[] {
  const box = sec.getBoundingClientRect();
  const out: Run[] = [];
  const range = document.createRange();
  const walk = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const el = n.parentElement;
    if (!el || el.closest('math, svg')) continue;
    const size = parseFloat(getComputedStyle(el).fontSize) || 16;
    const s = n.textContent ?? '';
    const re = /\S+/g;
    for (let m = re.exec(s); m; m = re.exec(s)) {
      range.setStart(n, m.index);
      range.setEnd(n, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      out.push({ x: (r.left - box.left) * scale, top: (r.top - box.top + (r.height - size) / 2) * scale, w: r.width * scale, h: size * scale, str: m[0] });
    }
  }
  return out;
}

export interface PicData {
  src: string;
  w: number;
  h: number;
}

const MAX_SIDE = 2400;

/** Μετατρέπει εικόνα (Blob) σε dataURL, με σμίκρυνση αν είναι τεράστια. */
export async function blobToPic(blob: Blob): Promise<PicData> {
  const bmp = await createImageBitmap(blob);
  const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * s));
  const h = Math.max(1, Math.round(bmp.height * s));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  cv.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const jpeg = blob.type === 'image/jpeg';
  return { src: cv.toDataURL(jpeg ? 'image/jpeg' : 'image/png', 0.9), w, h };
}

/** Ανοιγμένο PDF: πόσες σελίδες έχει, μικρογραφίες για να διαλέξεις, και μετατροπή όσων θέλεις σε σελίδες του πίνακα. */
export interface OpenPdf {
  n: number;
  /** Μικρογραφία της σελίδας i (από 0), πλάτους w. */
  thumb(i: number, w: number): Promise<HTMLCanvasElement>;
  /** Οι σελίδες της λίστας (από 0) γίνονται σελίδες του πίνακα, καθεμιά με την εικόνα της· με `asText` και με το κείμενό της ως κείμενα. */
  pages(list: number[], onProgress: (done: number, total: number) => void, asText?: boolean): Promise<Page[]>;
  close(): void;
}

export async function openPdf(file: File): Promise<OpenPdf> {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const render = async (i: number, scaleFor: (w: number, h: number) => number, withText = false): Promise<{ cv: HTMLCanvasElement; runs?: Run[] }> => {
    const page = await pdf.getPage(i + 1);
    const v1 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: scaleFor(v1.width, v1.height) });
    const cv = document.createElement('canvas');
    cv.width = Math.round(vp.width);
    cv.height = Math.round(vp.height);
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas: cv }).promise;
    let runs: Run[] | undefined;
    if (withText) {
      runs = [];
      for (const it of (await page.getTextContent()).items) {
        if (!('str' in it) || !it.str.trim()) continue;
        const [a, b, c, d, x, base] = pdfjs.Util.transform(vp.transform, it.transform) as number[];
        // πλάγιο ή στραμμένο κείμενο μένει στην εικόνα
        if (Math.abs(b) > 1e-3 || Math.abs(c) > 1e-3 || a <= 0) continue;
        const h = Math.abs(d);
        runs.push({ x, top: base - 0.85 * h, w: it.width * vp.scale, h, str: it.str });
      }
    }
    page.cleanup();
    return { cv, runs };
  };
  return {
    n: pdf.numPages,
    thumb: async (i, w) => (await render(i, (pw) => w / pw)).cv,
    async pages(list, onProgress, asText) {
      const pages: Page[] = [];
      for (let k = 0; k < list.length; k++) {
        onProgress(k, list.length);
        const { cv, runs } = await render(list[k], (pw, ph) => Math.min(1800 / pw, 2600 / ph, 3), asText);
        pages.push(toPage(cv, 0.88, runs));
      }
      onProgress(list.length, list.length);
      return pages;
    },
    close: () => void pdf.cleanup(),
  };
}

/**
 * Ανοίγει αρχείο Word (.docx) και το δίνει σαν PDF: σελίδες που γίνονται εικόνες.
 * Το έγγραφο στήνεται κρυφά ως HTML και κάθε σελίδα του «φωτογραφίζεται» από τον ίδιο τον browser,
 * ώστε να βγαίνουν σωστά ελληνικά, πίνακες, εικόνες και μαθηματικοί τύποι.
 */
export async function openDocx(file: File): Promise<OpenPdf> {
  const docx = await import('docx-preview');
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;width:1200px;visibility:hidden;pointer-events:none';
  document.body.append(host);
  const styles = document.createElement('div');
  const body = document.createElement('div');
  host.append(styles, body);
  try {
    // renderAltChunks: το ενσωματωμένο HTML θα έτρεχε ως iframe χωρίς sandbox, με την προέλευση της εφαρμογής
    await docx.renderAsync(file, body, styles, { breakPages: true, useBase64URL: true, experimental: true, ignoreLastRenderedPageBreak: false, renderAltChunks: false });
  } catch (err) {
    host.remove();
    throw err;
  }
  const sections = [...body.querySelectorAll<HTMLElement>('section.docx')];
  if (sections.length === 0) {
    host.remove();
    throw new Error(t('Το έγγραφο δεν έχει περιεχόμενο', 'The document has no content'));
  }
  const ser = new XMLSerializer();
  const css = [...styles.querySelectorAll('style')].map((st) => ser.serializeToString(st)).join('');
  const render = async (i: number, scaleFor: (w: number, h: number) => number): Promise<HTMLCanvasElement> => {
    const sec = sections[i];
    const w = Math.ceil(sec.offsetWidth), h = Math.ceil(sec.offsetHeight);
    const scale = scaleFor(w, h);
    // SVG με το HTML της σελίδας μέσα: ο browser το ζωγραφίζει όπως θα το έδειχνε στην οθόνη
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" viewBox="0 0 ${w} ${h}">` +
      `<foreignObject width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="docx-wrapper" style="padding:0;margin:0;background:#fff;display:block">` +
      css +
      `<style>.docx-wrapper>section.docx{margin:0!important;box-shadow:none!important;background:#fff}</style>` +
      ser.serializeToString(sec) +
      `</div></foreignObject></svg>`;
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    return cv;
  };
  return {
    n: sections.length,
    thumb: (i, w) => render(i, (pw) => w / pw),
    async pages(list, onProgress, asText) {
      const pages: Page[] = [];
      for (let k = 0; k < list.length; k++) {
        onProgress(k, list.length);
        const fit = (pw: number, ph: number): number => Math.min(1800 / pw, 2600 / ph, 3);
        const cv = await render(list[k], fit);
        const sec = sections[list[k]];
        pages.push(toPage(cv, 0.9, asText ? domRuns(sec, fit(Math.ceil(sec.offsetWidth), Math.ceil(sec.offsetHeight))) : undefined));
      }
      onProgress(list.length, list.length);
      return pages;
    },
    close: () => host.remove(),
  };
}

/** Στιγμιότυπο οθόνης/παραθύρου μέσω του προγράμματος περιήγησης. */
export async function captureScreen(): Promise<PicData> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('unsupported');
  }
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await new Promise((r) => setTimeout(r, 300));
    const cv = document.createElement('canvas');
    cv.width = video.videoWidth;
    cv.height = video.videoHeight;
    cv.getContext('2d')!.drawImage(video, 0, 0);
    return { src: cv.toDataURL('image/png'), w: cv.width, h: cv.height };
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

/** Εικόνα από το clipboard (κουμπί «Επικόλληση»). */
export async function clipboardImage(): Promise<Blob | null> {
  const items = await navigator.clipboard.read();
  for (const it of items) {
    const type = it.types.find((t) => t.startsWith('image/'));
    if (type) return it.getType(type);
  }
  return null;
}
