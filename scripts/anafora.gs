/**
 * PrismaBoard – παραλήπτης αναφορών προβλήματος (Google Apps Script).
 * Δέχεται την αναφορά που στέλνει το κουμπί «Αναφορά» της εφαρμογής και τη στέλνει με email στον λογαριασμό
 * Google που έστησε το σενάριο. Η διεύθυνση email δεν φαίνεται πουθενά στην εφαρμογή.
 *
 * Στήσιμο (μία φορά):
 *  1. script.google.com → «Νέο έργο», με όνομα π.χ. «PrismaBoard αναφορές».
 *  2. Σβήστε ό,τι υπάρχει και επικολλήστε όλο αυτό το αρχείο. Αποθήκευση.
 *  3. «Ανάπτυξη» → «Νέα ανάπτυξη» → τύπος «Εφαρμογή ιστού».
 *     Εκτέλεση ως: «Εγώ». Πρόσβαση: «Οποιοσδήποτε». → «Ανάπτυξη» και επιτρέψτε την πρόσβαση στο Gmail.
 *  4. Αντιγράψτε τη διεύθυνση που τελειώνει σε /exec και βάλτε τη στο REPORT_URL του src/errors.ts.
 * Δοκιμή: εκτελέστε μία φορά τη συνάρτηση testMail από τον επεξεργαστή· πρέπει να έρθει email.
 * Σε αλλαγή του σεναρίου: «Ανάπτυξη» → «Διαχείριση αναπτύξεων» → επεξεργασία → «Νέα έκδοση» (η διεύθυνση μένει ίδια).
 */
const MAX = 8000;
/** Πόσες αναφορές το πολύ ανά 10 λεπτά, ώστε κάποιος που στέλνει μαζικά να μη γεμίσει το Gmail. */
const PER_10_MIN = 20;

function doPost(e) {
  const out = (s) => ContentService.createTextOutput(s);
  try {
    const r = JSON.parse(String((e.postData && e.postData.contents) || '').slice(0, MAX));
    if (r.app !== 'prismaboard') return out('no');
    const cache = CacheService.getScriptCache();
    const n = Number(cache.get('n') || 0);
    if (n >= PER_10_MIN || MailApp.getRemainingDailyQuota() < 5) return out('busy');
    cache.put('n', String(n + 1), 600);
    const note = String(r.note || '').trim().slice(0, 1500);
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: 'PrismaBoard: ' + String(r.title || 'αναφορά').slice(0, 100),
      body: (note ? 'Τι έγραψε ο χρήστης:\n' + note + '\n\n' : '') + String(r.details || '').slice(0, 5000),
      name: 'PrismaBoard',
    });
    return out('ok');
  } catch (err) {
    // φαίνεται στο script.google.com → «Εκτελέσεις»
    console.error(err);
    return out('error');
  }
}

/** Δοκιμή από τον επεξεργαστή (Εκτέλεση → testMail): ζητά τις άδειες και στέλνει ένα email. */
function testMail() {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'PrismaBoard: δοκιμή', 'Το σενάριο των αναφορών στέλνει email.');
}
