/**
 * Η σελίδα «Άδειες τρίτων» (public/adeies.html και η αγγλική public/adeies-en.html) φτιάχνεται σε κάθε build από τις βιβλιοθήκες που μπαίνουν στην εφαρμογή:
 * τα πακέτα npm που δεν είναι μόνο για την ανάπτυξη, και τα crates του Rust του προγράμματος Windows.
 * Τα crates τα δίνει το cargo· όπου δεν υπάρχει cargo, κρατιέται η λίστα του προηγούμενου build (scripts/rust-crates.json).
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RUST = 'scripts/rust-crates.json';
// πακέτα που τα χρειάζεται μόνο το Node (π.χ. το pdf.js εκτός browser) και δεν μπαίνουν στην εφαρμογή
const NODE_ONLY = /^@napi-rs\//;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Όλα τα πακέτα npm της εφαρμογής, μία φορά το καθένα (όνομα → φάκελος). */
function npmPackages() {
  // μέσω shell: στα Windows το npm είναι npm.cmd και δεν τρέχει απευθείας με execFileSync
  const tree = JSON.parse(execSync('npm ls --omit=dev --all --long --json', { encoding: 'utf8', maxBuffer: 64 << 20 }));
  const found = new Map();
  const walk = (deps) => {
    for (const [name, d] of Object.entries(deps ?? {})) {
      if (NODE_ONLY.test(name) || !d.path || found.has(name)) continue;
      found.set(name, d.path);
      walk(d.dependencies);
    }
  };
  walk(tree.dependencies);
  return [...found].sort(([a], [b]) => a.localeCompare(b)).map(([name, dir]) => {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying)/i.test(f));
    const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    return {
      name,
      version: pkg.version,
      license: pkg.license ?? pkg.licenses?.map((l) => l.type).join(' OR ') ?? '—',
      url: pkg.homepage ?? repo?.replace(/^git\+/, '').replace(/\.git$/, ''),
      text: file ? readFileSync(join(dir, file), 'utf8').trim() : '',
    };
  });
}

/** Τα crates του Rust που μπαίνουν στο πρόγραμμα των Windows (όνομα, έκδοση, άδεια). */
function rustCrates() {
  try {
    const meta = JSON.parse(execFileSync('cargo', ['metadata', '--format-version', '1', '--locked', '--filter-platform', 'x86_64-pc-windows-msvc', '--manifest-path', 'src-tauri/Cargo.toml'], { encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'ignore'] }));
    const root = meta.resolve.root;
    // μόνο όσα χρειάζεται το πρόγραμμα όταν τρέχει, όχι τα εργαλεία του build
    const nodes = new Map(meta.resolve.nodes.map((n) => [n.id, n]));
    const keep = new Set(), todo = [root];
    while (todo.length) {
      const id = todo.pop();
      if (keep.has(id)) continue;
      keep.add(id);
      for (const d of nodes.get(id)?.deps ?? []) if (d.dep_kinds.some((k) => k.kind === null)) todo.push(d.pkg);
    }
    const crates = meta.packages
      .filter((p) => keep.has(p.id) && p.id !== root)
      .map((p) => ({ name: p.name, version: p.version, license: p.license ?? (p.license_file ? 'LICENSE' : '—'), url: p.repository ?? '' }))
      .sort((a, b) => a.name.localeCompare(b.name));
    writeFileSync(RUST, JSON.stringify(crates, null, 1) + '\n');
    return crates;
  } catch {
    if (existsSync(RUST)) return JSON.parse(readFileSync(RUST, 'utf8'));
    console.warn('adeies: χωρίς cargo και χωρίς προηγούμενη λίστα· η σελίδα δεν θα έχει τα crates του Rust');
    return [];
  }
}

const npm = npmPackages(), rust = rustCrates();
const link = (url, text) => (url ? `<a href="${esc(url)}" rel="noopener" target="_blank">${esc(text)}</a>` : esc(text));

/** Η σελίδα σε μία γλώσσα: L(ελληνικά, αγγλικά). */
const page = (en) => {
const L = (el, eng) => (en ? eng : el);
return `<!doctype html>
<html lang="${L('el', 'en')}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PrismaBoard – ${L('Άδειες τρίτων', 'Third-party licenses')}</title>
<!-- φτιάχνεται από το scripts/adeies.mjs σε κάθε build· οι αλλαγές με το χέρι χάνονται -->
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; font: 18px/1.55 system-ui, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 860px; margin: 0 auto; padding: 28px 18px 60px; }
  h1 { font-size: 30px; margin: 0 0 4px; }
  h2 { font-size: 21px; margin: 30px 0 6px; }
  p { margin: 8px 0; }
  .mut { opacity: .7; }
  details { border-bottom: 1px solid rgba(128,128,128,.3); padding: 6px 0; }
  summary { cursor: pointer; }
  summary small { opacity: .7; }
  pre { white-space: pre-wrap; font-size: 13px; line-height: 1.4; background: rgba(128,128,128,.1); padding: 10px 12px; border-radius: 6px; overflow-wrap: anywhere; }
  table { width: 100%; border-collapse: collapse; font-size: 15px; }
  td { padding: 3px 6px; border-bottom: 1px solid rgba(128,128,128,.25); overflow-wrap: anywhere; }
  td:nth-child(2) { white-space: nowrap; }
</style>
</head>
<body>
<main>
  <img src="./logo.svg" alt="PrismaBoard" width="64" height="64" />
  <p><a href="./${L('adeies-en.html', 'adeies.html')}">${L('English', 'Ελληνικά')}</a></p>
  <h1>${L('Άδειες τρίτων', 'Third-party licenses')}</h1>
  <p>${L('Το PrismaBoard χρησιμοποιεί τις παρακάτω βιβλιοθήκες ανοιχτού κώδικα. Ευχαριστούμε τους δημιουργούς τους. Κάθε βιβλιοθήκη διανέμεται με τη δική της άδεια, που ακολουθεί.', 'PrismaBoard uses the open-source libraries below. Thanks to their authors. Each library is distributed under its own license, shown below.')}</p>
  <p><a href="./privacy.html">${L('Πολιτική απορρήτου', 'Privacy policy')}</a></p>

  <h2>${L('Βιβλιοθήκες της εφαρμογής', 'App libraries')}</h2>
${npm.map((p) => `  <details>
    <summary><b>${esc(p.name)}</b> ${esc(p.version)} · ${esc(p.license)}</summary>
    <p>${link(p.url, p.url ?? '')}</p>
    ${p.text ? `<pre>${esc(p.text)}</pre>` : `<p class="mut">${L('Άδεια', 'License')} ${esc(p.license)}.</p>`}
  </details>`).join('\n')}
${rust.length ? `
  <h2>${L('Πρόγραμμα για Windows', 'Windows app')}</h2>
  <p>${L(`Το πρόγραμμα για Windows είναι χτισμένο με το ${link('https://tauri.app', 'Tauri')} και περιέχει επιπλέον τα παρακάτω crates του Rust. Τα πλήρη κείμενα των αδειών τους υπάρχουν στον σύνδεσμο του καθενός.`, `The Windows app is built with ${link('https://tauri.app', 'Tauri')} and also contains the Rust crates below. The full texts of their licenses are at each link.`)}</p>
  <table>
${rust.map((c) => `    <tr><td>${link(c.url, c.name)}</td><td>${esc(c.version)}</td><td>${esc(c.license)}</td></tr>`).join('\n')}
  </table>` : ''}
</main>
</body>
</html>
`;
};
writeFileSync('public/adeies.html', page(false));
writeFileSync('public/adeies-en.html', page(true));
console.log(`adeies: ${npm.length} πακέτα npm, ${rust.length} crates`);
