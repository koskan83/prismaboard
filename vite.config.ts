import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

/** Γράφει τη λίστα των αρχείων του build, ώστε ο service worker να τα αποθηκεύσει για χρήση χωρίς ίντερνετ. */
function precacheList(): Plugin {
  return {
    name: 'precache-list',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = ['./', 'manifest.webmanifest', 'icon-256.png', 'icon-512.png', 'favicon.svg', 'logo.svg', 'logo-light.svg', 'odigies.html', 'odigies-en.html', 'adeies.html', 'adeies-en.html', 'privacy.html', ...Object.keys(bundle)];
      this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(files) });
    },
  };
}

export default defineConfig({
  base: './',
  // η έκδοση (από το package.json) και η μέρα του build: φαίνονται στο ☰, για να ξέρεις τι έχει φορτώσει
  define: {
    __BUILD__: JSON.stringify(new Date().toLocaleDateString('sv')),
    __APP__: JSON.stringify(JSON.parse(readFileSync('package.json', 'utf8')).version),
    // μοναδικό ανά build: αλλάζει το URL του service worker, άρα κάθε build ξαναγεμίζει την offline cache (βλ. sw.js)
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
  build: { target: 'es2022' },
  server: { port: 5173, strictPort: true },
  clearScreen: false,
  plugins: [precacheList()],
});
