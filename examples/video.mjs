/**
 * Βιντεάκι παρουσίασης (~70″): το έτοιμο μάθημα «Οριζόντια βολή» ανοίγει και «παίζεται» με τα εργαλεία της Παρουσίασης.
 * Γράφεται από τον dev server (ώστε η προβολή κάθε σελίδας να προσαρμόζεται στην οθόνη του βίντεο):
 *   npm run dev -- --port 5174      (σε άλλο τερματικό)
 *   node examples/video.mjs [http://localhost:5174/]
 * Βγάζει το examples/orizontia-voli.webm και το examples/orizontia-voli.jpg (η κάρτα του τίτλου, για εικόνα προεπισκόπησης).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { findChrome } from '../scripts/find-chrome.mjs';

const URL_ = process.argv[2] ?? 'http://localhost:5174/';
const W = 1280, H = 720;
const LESSON = resolve('examples/Οριζόντια βολή - Β Λυκείου.json');
const OUT = 'examples/orizontia-voli';
const TITLE = '<div style="font-size:54px;color:#93c5fd">PrismaBoard</div><div>Έτοιμο μάθημα: Οριζόντια βολή</div><div style="font:500 24px system-ui;color:#cbd5e1">Φυσική Β΄ Λυκείου · με τα εργαλεία της Παρουσίασης</div>';
const NEWS_ID = /NEWS_ID = '([^']+)'/.exec(readFileSync('src/news.ts', 'utf8'))[1];
const T0 = Date.now();
const ts = () => `${((Date.now() - T0) / 1000).toFixed(1).padStart(6)}″`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: 'el-GR' });
await ctx.addInitScript((news) => {
  if (sessionStorage.getItem('video')) return;
  localStorage.setItem('grafida.news', news);
  sessionStorage.setItem('video', '1');
  localStorage.setItem('grafida.welcome', '1');
  localStorage.setItem('grafida.startscr', '0');
  localStorage.setItem('grafida.level', 'secondary');
  localStorage.setItem('grafida.safe', JSON.stringify({ at: Date.now(), done: false, ids: {}, gone: [], told: Date.now() }));
}, NEWS_ID);
// η κάρτα του τίτλου φαίνεται από την πρώτη στιγμή, όσο φορτώνει η εφαρμογή
await ctx.addInitScript((html) => {
  const k = document.createElement('div');
  k.id = 'vCard';
  k.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#111827;color:#fff;font:600 30px/1.3 system-ui,sans-serif;text-align:center;z-index:2147483647;transition:opacity .4s;pointer-events:none';
  k.innerHTML = html;
  // τα init scripts τρέχουν πριν υπάρξει το <html>: η κάρτα μπαίνει μόλις εμφανιστεί
  const put = () => (document.documentElement ? document.documentElement.append(k) : setTimeout(put, 2));
  put();
}, TITLE);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('σφάλμα στη σελίδα:', e.message));
await page.goto(URL_);
await page.waitForSelector('#toolbar');
await sleep(1200);
// πρόσβαση στον πίνακα (μόνο στον dev server): για προσαρμογή της προβολής και θέσεις στοιχείων
await page.evaluate(async () => {
  const url = performance.getEntriesByType('resource').map((e) => e.name).find((u) => /\/src\/app\.ts/.test(u));
  window.__bd = (await import(url)).board;
});

// ---------- «δάχτυλο», λεζάντες, κάρτες ----------
await page.evaluate(() => {
  const d = document.createElement('div');
  d.id = 'vFinger';
  d.style.cssText = 'position:fixed;left:0;top:0;width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;background:rgba(37,99,235,.18);border:3px solid rgba(37,99,235,.75);pointer-events:none;z-index:2147483647;opacity:0;transition:opacity .15s,transform .12s,background .12s';
  document.body.append(d);
  const at = (e) => { d.style.left = `${e.clientX}px`; d.style.top = `${e.clientY}px`; d.style.opacity = '1'; };
  addEventListener('pointermove', at, true);
  addEventListener('pointerdown', (e) => { at(e); d.style.transform = 'scale(.8)'; d.style.background = 'rgba(37,99,235,.45)'; }, true);
  addEventListener('pointerup', () => { d.style.transform = ''; d.style.background = 'rgba(37,99,235,.18)'; }, true);
  const c = document.createElement('div');
  c.id = 'vCap';
  c.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);white-space:nowrap;padding:9px 20px;border-radius:12px;background:#ea580c;color:#fff;font:600 19px/1.3 system-ui,sans-serif;text-align:center;z-index:2147483646;pointer-events:none;opacity:0;transition:opacity .25s';
  document.body.append(c);
});
const cap = (t) => (console.log(ts(), '▸', t), page.evaluate((t) => { const c = document.getElementById('vCap'); c.textContent = t; c.style.opacity = t ? '1' : '0'; }, t));
const card = (html) => page.evaluate((html) => { const k = document.getElementById('vCard'); if (html) k.innerHTML = html; k.style.opacity = html ? '1' : '0'; }, html);

let hx = W / 2, hy = H / 2;
const move = async (x, y, steps = 18) => { await page.mouse.move(x, y, { steps }); hx = x; hy = y; };
const tap = async (x, y) => { await move(x, y); await sleep(180); await page.mouse.down(); await sleep(90); await page.mouse.up(); await sleep(400); };
const box = async (sel) => {
  const l = page.locator(sel).first();
  await l.scrollIntoViewIfNeeded();
  const b = await l.boundingBox();
  if (!b) throw new Error(`δεν φαίνεται: ${sel}`);
  return b;
};
const tapEl = async (sel) => { console.log(ts(), '   πάτημα', sel); const b = await box(sel); await tap(b.x + b.width / 2, b.y + b.height / 2); };
const away = () => move(W - 70, H / 2 - 140, 14);
/** Σημείο του πίνακα (συντεταγμένες μαθήματος) στην οθόνη. */
const scr = (x, y) => page.evaluate(([x, y]) => { const v = window.__bd.page.view; return [x * v.k + v.x, y * v.k + v.y]; }, [x, y]);
const replayDone = async (max = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < max && (await page.evaluate(() => !!window.__bd.replay))) await sleep(200);
  console.log(`   αναπαραγωγή: ${((Date.now() - t0) / 1000).toFixed(1)}″`);
};
const replay = async () => { await tapEl('#gadgetBtn'); await sleep(350); await tapEl('#gadgetMenu [data-view="replay"]'); };

// ---------- εγγραφή: καρέ από το Chrome (screencast), ξεκινώντας από την κάρτα του τίτλου ----------
await page.screenshot({ path: `${OUT}.jpg`, type: 'jpeg', quality: 88 });
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', (f) => {
  frames.push({ data: f.data, t: f.metadata.timestamp });
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H });
await sleep(3000);
await card('');
await sleep(500);

// 1. Άνοιγμα του μαθήματος
await cap('1. ☰ → Άνοιγμα… → το αρχείο του μαθήματος');
await tapEl('#menuBtn');
await tapEl('#menu [data-act="openwhere"]');
const [fc] = await Promise.all([page.waitForEvent('filechooser'), tapEl('#whereMenu [data-act="open"]')]);
await fc.setFiles(LESSON);
await sleep(1500);
// κάθε σελίδα προσαρμόζεται στην οθόνη του βίντεο (στην τάξη: ☰ → Προσαρμογή προβολής, αν χρειαστεί)
await page.evaluate(() => { const b = window.__bd; for (let i = b.doc.pages.length - 1; i >= 0; i--) { b.goto(i); b.fitView(); } });
await away();
await sleep(1200);

// 2. Αναπαραγωγή μιας σελίδας από την αρχή
await cap('2. Όργανα → Αναπαραγωγή: η σελίδα γράφεται με τη σειρά');
await replay();
await away();
await replayDone();
await sleep(1200);

// 3. Παύση και ένα βήμα τη φορά
await cap('3. ⏸ παύση, ⏭ ένα βήμα: σταματάς και ρωτάς την τάξη');
await tapEl('#next');
await sleep(500);
await replay();
await sleep(2600);
await tapEl('#replayBar [data-rp="pause"]');
await sleep(1500);
for (let i = 0; i < 4; i++) { await tapEl('#replayBar [data-rp="step"]'); await sleep(650); }
await cap('▶ και συνεχίζει μόνο του ως το τέλος');
await tapEl('#replayBar [data-rp="pause"]');
await away();
await replayDone(20000);
await sleep(1500);

// 4. Σχήμα με κίνηση
await cap('4. Σχήμα με κίνηση: επιλογή και «▶ Κίνηση»');
await tapEl('#next');
await sleep(900);
await tapEl('#tools [data-tool="select"]');
await tap(...(await scr(1280, 415)));
await tapEl('#spPlay');
await away();
await sleep(5200);
await tapEl('#spPlay');
await sleep(500);

// 5. Γραφική παράσταση με δρομείς
await cap('5. Δρομείς: μεγαλώνει το υ₀, μεγαλώνει το βεληνεκές');
await tapEl('#next');
await sleep(1600);
await tapEl('#next');
await sleep(900);
await tap(...(await scr(960, 550)));
await tapEl('#fnBtn');
await sleep(700);
if (process.env.VIDEO_DEBUG) await page.screenshot({ path: `${OUT}-fn.png` });
const sl = await box('#fnParams input[data-par="υ"]');
// ο δρομέας πάει από −20 ως 20: το 10 είναι στα 3/4, το 16 στα 9/10
await move(sl.x + sl.width * 0.75, sl.y + sl.height / 2);
await sleep(300);
await page.mouse.down();
await page.mouse.move(sl.x + sl.width * 0.9, sl.y + sl.height / 2, { steps: 40 });
await sleep(500);
await page.mouse.move(sl.x + sl.width * 0.81, sl.y + sl.height / 2, { steps: 30 });
await page.mouse.up();
await sleep(1200);
await tapEl('#fnClose');
await away();
await sleep(1200);

// 6. Παράδειγμα και άσκηση
await cap('6. Λυμένο παράδειγμα');
await tapEl('#next');
await away();
await sleep(3500);
await cap('7. Άσκηση: ⏭ βήμα βήμα, οι απαντήσεις στο τέλος');
await tapEl('#next');
await sleep(500);
await replay();
await sleep(1500);
await tapEl('#replayBar [data-rp="pause"]');
for (let i = 0; i < 12 && (await page.evaluate(() => !!window.__bd.replay)); i++) { await tapEl('#replayBar [data-rp="step"]'); await sleep(550); }
await away();
await replayDone(4000);
await sleep(2200);
await cap('');
await page.evaluate(() => { document.getElementById('vFinger').style.opacity = '0'; });
await card('<div style="font-size:54px;color:#93c5fd">PrismaBoard</div><div>Ο διαδραστικός πίνακας για την τάξη</div><div style="font:500 26px system-ui;color:#cbd5e1">prismaboard.klabs.gr</div>');
await sleep(3500);
const end = Date.now() / 1000;
await cdp.send('Page.stopScreencast');
if (frames.length === 0) throw new Error('κανένα καρέ');

// κωδικοποίηση μέσα στο Chrome: τα καρέ ξαναπαίζονται στον ίδιο ρυθμό πάνω σε καμβά και τα γράφει το MediaRecorder·
// το παράθυρο κωδικοποίησης ζητά κάθε καρέ τη στιγμή που το χρειάζεται (όλα μαζί δεν χωρούν για ένα λεπτό βίντεο)
const enc = await ctx.newPage();
await enc.exposeFunction('frameAt', (k) => frames[k].data);
await enc.setContent('<!doctype html><body style="margin:0"></body>');
const b64 = await enc.evaluate(async ({ times, end, W, H }) => {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  document.body.append(cv);
  const c = cv.getContext('2d');
  const img = async (k) => { const i = new Image(); i.src = `data:image/jpeg;base64,${await window.frameAt(k)}`; await i.decode(); return i; };
  let cur = await img(0), shown = 0;
  c.drawImage(cur, 0, 0, W, H);
  const rec = new MediaRecorder(cv.captureStream(30), { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 1_600_000 });
  const chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.start(1000);
  const t0 = performance.now(), base = times[0], total = (end - base) * 1000;
  let k = 0;
  while (performance.now() - t0 < total) {
    const now = performance.now() - t0;
    while (k + 1 < times.length && (times[k + 1] - base) * 1000 <= now) k++;
    if (k !== shown) { cur = await img(k); shown = k; }
    c.drawImage(cur, 0, 0, W, H);
    await new Promise((r) => setTimeout(r, 33));
  }
  await new Promise((r) => { rec.onstop = r; rec.stop(); });
  const buf = new Uint8Array(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}, { times: frames.map((f) => f.t), end, W, H });
const out = Buffer.from(b64, 'base64');
writeFileSync(`${OUT}.webm`, out);
console.log(`${OUT}.webm  ${(out.length / 1024 / 1024).toFixed(1)} MB, ${(end - frames[0].t).toFixed(1)}″, ${frames.length} καρέ`);
await browser.close();
