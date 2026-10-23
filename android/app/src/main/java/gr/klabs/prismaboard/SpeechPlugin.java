package gr.klabs.prismaboard;

import android.content.Context;
import android.media.AudioManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Ανάγνωση φωναχτά στην εφαρμογή Android. Το WebView δεν έχει τη φωνή του browser (speechSynthesis),
 * οπότε μιλά η φωνή της συσκευής (TextToSpeech, π.χ. Google Speech Services). Βλ. src/android.ts.
 */
@CapacitorPlugin(name = "Speech")
public class SpeechPlugin extends Plugin {

    private TextToSpeech tts;
    /** null: ακόμη ετοιμάζεται· μετά true/false. */
    private Boolean ready;
    /** Κλήσεις που ήρθαν πριν ετοιμαστεί η φωνή. */
    private final List<PluginCall> pending = new ArrayList<>();
    private PluginCall speaking;
    /** Το id της φράσης που λέγεται: τα μηνύματα μιας παλιότερης, που κόπηκε, δεν αφορούν την τωρινή. */
    private String speakingId;
    /** Το πρόθεμα της φράσης που λέγεται ("sayN.") και αν άρχισε έστω ένα κομμάτι της να ακούγεται. */
    private String speakingPrefix;
    private boolean started;
    private int count;
    /** Η μηχανή φωνής που ζητήθηκε· null: η προεπιλογή της συσκευής. */
    private String engine;
    private static final String GOOGLE = "com.google.android.tts";

    @Override
    public void load() {
        init();
    }

    /** (Ξανα)στήνει τη φωνή· ό,τι περιμένει στο pending λέγεται μόλις ετοιμαστεί. */
    private void init() {
        synchronized (this) {
            if (tts != null) tts.shutdown();
            // null και όχι η παλιά: χωρίς μηχανή η onInit έρχεται μέσα στον constructor, πριν το tts πάρει τη νέα τιμή
            tts = null;
            ready = null;
        }
        final TextToSpeech[] made = new TextToSpeech[1];
        TextToSpeech.OnInitListener onInit = (status) -> {
            TextToSpeech t = made[0];
            // ο listener μπαίνει πριν γίνει ready: αλλιώς μια speak στο ενδιάμεσο δεν θα έπαιρνε ποτέ onDone
            if (status == TextToSpeech.SUCCESS) t.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { heard(id); }
                @Override public void onDone(String id) { spoken(id); }
                @Override public void onError(String id) { finish(id, false, "error"); }
                @Override public void onStop(String id, boolean interrupted) { finish(id, true, ""); }
            });
            List<PluginCall> calls;
            synchronized (this) {
                if (t != tts) return; // παλιά, στο μεταξύ στήθηκε άλλη
                ready = status == TextToSpeech.SUCCESS;
                // η φωνή της Google δεν ξεκίνησε: την επόμενη φορά πάλι η προεπιλογή της συσκευής
                if (!ready) engine = null;
                calls = new ArrayList<>(pending);
                pending.clear();
            }
            // αποτυχία: δεν ξαναδοκιμάζουμε εδώ (η speak θα ξαναέστηνε τη φωνή χωρίς τέλος)· η επόμενη κλήση ξαναδοκιμάζει
            for (PluginCall c : calls) {
                if (Boolean.TRUE.equals(ready)) speak(c);
                else done(c, false, "noengine");
            }
        };
        synchronized (this) {
            tts = made[0] = engine == null ? new TextToSpeech(getContext(), onInit) : new TextToSpeech(getContext(), onInit, engine);
        }
    }

    /** { text, lang: 'el-GR', rate: 0.8 } → { spoken, why, engine } όταν τελειώσει· spoken: false αν η συσκευή δεν έχει φωνή για τη γλώσσα. */
    @PluginMethod
    public void speak(PluginCall call) {
        synchronized (this) {
            if (ready == null) {
                pending.add(call);
                return;
            }
            if (!ready) {
                // η φωνή δεν στήθηκε (π.χ. η μηχανή άργησε να ξεκινήσει με την εφαρμογή): μία νέα προσπάθεια για αυτή την κλήση
                pending.add(call);
                init();
                return;
            }
        }
        int has = tts.setLanguage(Locale.forLanguageTag(call.getString("lang", "el-GR")));
        if (has == TextToSpeech.LANG_MISSING_DATA || has == TextToSpeech.LANG_NOT_SUPPORTED) {
            // η προεπιλεγμένη μηχανή (π.χ. του κατασκευαστή) δεν έχει τη γλώσσα: δοκιμάζουμε της Google, αν υπάρχει
            if (engine == null && !GOOGLE.equals(tts.getDefaultEngine()) && hasEngine(GOOGLE)) {
                synchronized (this) {
                    engine = GOOGLE;
                    pending.add(call);
                }
                init();
                return;
            }
            done(call, false, has == TextToSpeech.LANG_MISSING_DATA ? "nodata" : "nolang");
            return;
        }
        // η φωνή βγαίνει από την ένταση των πολυμέσων: στο μηδέν «μιλά» κανονικά αλλά δεν ακούγεται τίποτα
        AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        if (am != null && am.getStreamVolume(AudioManager.STREAM_MUSIC) == 0) {
            done(call, false, "mute");
            return;
        }
        tts.setSpeechRate(call.getFloat("rate", 1f));
        // η TextToSpeech δέχεται ως getMaxSpeechInputLength() χαρακτήρες ανά φράση: το μεγάλο κείμενο λέγεται σε κομμάτια
        List<String> parts = split(call.getString("text", ""), TextToSpeech.getMaxSpeechInputLength() - 1);
        String id;
        synchronized (this) {
            // ό,τι λεγόταν κόβεται (QUEUE_FLUSH)· η κλήση τελειώνει με το τελευταίο κομμάτι
            finish(speakingId, true, "");
            id = "say" + (++count);
            speaking = call;
            speakingId = id + "." + (parts.size() - 1);
            speakingPrefix = id + ".";
            started = false;
        }
        for (int i = 0; i < parts.size(); i++) {
            int r = tts.speak(parts.get(i), i == 0 ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, null, id + "." + i);
            if (r != TextToSpeech.SUCCESS) {
                synchronized (this) {
                    finish(speakingId, false, "speak");
                }
                return;
            }
        }
    }

    private boolean hasEngine(String name) {
        for (TextToSpeech.EngineInfo e : tts.getEngines()) if (name.equals(e.name)) return true;
        return false;
    }

    /** Κομμάτια ως `max` χαρακτήρες, κομμένα σε τέλος πρότασης ή σε κενό όταν γίνεται. */
    private static List<String> split(String text, int max) {
        List<String> out = new ArrayList<>();
        while (text.length() > max) {
            int cut = Math.max(text.lastIndexOf(". ", max), Math.max(text.lastIndexOf("\n", max), text.lastIndexOf("; ", max)));
            if (cut < max / 2) cut = text.lastIndexOf(' ', max);
            if (cut < max / 2) cut = max - 1;
            out.add(text.substring(0, cut + 1));
            text = text.substring(cut + 1);
        }
        out.add(text);
        return out;
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (Boolean.TRUE.equals(ready)) tts.stop();
        finish(speakingId, true, "");
        call.resolve();
    }

    /** Ένα κομμάτι της τωρινής φράσης άρχισε να ακούγεται. */
    private synchronized void heard(String id) {
        if (speakingPrefix != null && id != null && id.startsWith(speakingPrefix)) started = true;
    }

    /** Η μηχανή λέει ότι τελείωσε: αν δεν άρχισε ποτέ να ακούγεται, δεν ειπώθηκε τίποτα (π.χ. φωνή από το δίκτυο χωρίς σύνδεση). */
    private synchronized void spoken(String id) {
        if (id == null || !id.equals(speakingId)) return;
        finish(id, started, started ? "" : "silent");
    }

    /** Τελείωσε (ή σταμάτησε) η φράση `id`. */
    private synchronized void finish(String id, boolean ok, String why) {
        if (id == null || !id.equals(speakingId)) return;
        PluginCall c = speaking;
        speaking = null;
        speakingId = null;
        if (c != null) done(c, ok, why);
    }

    /** why: "" | noengine | nodata | nolang | mute | silent | speak | error· engine: η μηχανή φωνής, για το μήνυμα στον δάσκαλο. */
    private void done(PluginCall call, boolean spoken, String why) {
        JSObject out = new JSObject();
        out.put("spoken", spoken);
        out.put("why", why);
        String e = null;
        try {
            if (tts != null) e = engine != null ? engine : tts.getDefaultEngine();
        } catch (RuntimeException ignored) { /* χωρίς μηχανή */ }
        out.put("engine", e == null ? "" : e);
        call.resolve(out);
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) tts.shutdown();
    }
}
