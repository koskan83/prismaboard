package gr.klabs.prismaboard;

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
    private int count;

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), (status) -> {
            // ο listener μπαίνει πριν γίνει ready: αλλιώς μια speak στο ενδιάμεσο δεν θα έπαιρνε ποτέ onDone
            if (status == TextToSpeech.SUCCESS) tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) {}
                @Override public void onDone(String id) { finish(id, true); }
                @Override public void onError(String id) { finish(id, false); }
                @Override public void onStop(String id, boolean interrupted) { finish(id, true); }
            });
            List<PluginCall> calls;
            synchronized (this) {
                ready = status == TextToSpeech.SUCCESS;
                calls = new ArrayList<>(pending);
                pending.clear();
            }
            for (PluginCall c : calls) speak(c);
        });
    }

    /** { text, lang: 'el-GR', rate: 0.8 } → { spoken } όταν τελειώσει· spoken: false αν η συσκευή δεν έχει φωνή για τη γλώσσα. */
    @PluginMethod
    public void speak(PluginCall call) {
        synchronized (this) {
            if (ready == null) {
                pending.add(call);
                return;
            }
        }
        if (!ready) {
            done(call, false);
            return;
        }
        int has = tts.setLanguage(Locale.forLanguageTag(call.getString("lang", "el-GR")));
        if (has == TextToSpeech.LANG_MISSING_DATA || has == TextToSpeech.LANG_NOT_SUPPORTED) {
            done(call, false);
            return;
        }
        tts.setSpeechRate(call.getFloat("rate", 1f));
        // η TextToSpeech δέχεται ως getMaxSpeechInputLength() χαρακτήρες ανά φράση: το μεγάλο κείμενο λέγεται σε κομμάτια
        List<String> parts = split(call.getString("text", ""), TextToSpeech.getMaxSpeechInputLength() - 1);
        String id;
        synchronized (this) {
            // ό,τι λεγόταν κόβεται (QUEUE_FLUSH)· η κλήση τελειώνει με το τελευταίο κομμάτι
            finish(speakingId, true);
            id = "say" + (++count);
            speaking = call;
            speakingId = id + "." + (parts.size() - 1);
        }
        for (int i = 0; i < parts.size(); i++) {
            int r = tts.speak(parts.get(i), i == 0 ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, null, id + "." + i);
            if (r != TextToSpeech.SUCCESS) {
                synchronized (this) {
                    finish(speakingId, false);
                }
                return;
            }
        }
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
        finish(speakingId, true);
        call.resolve();
    }

    /** Τελείωσε (ή σταμάτησε) η φράση `id`. */
    private synchronized void finish(String id, boolean ok) {
        if (id == null || !id.equals(speakingId)) return;
        PluginCall c = speaking;
        speaking = null;
        speakingId = null;
        if (c != null) done(c, ok);
    }

    private void done(PluginCall call, boolean spoken) {
        JSObject out = new JSObject();
        out.put("spoken", spoken);
        call.resolve(out);
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) tts.shutdown();
    }
}
