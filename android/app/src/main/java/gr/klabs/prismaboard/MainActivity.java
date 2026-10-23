package gr.klabs.prismaboard;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // τα δικά μας plugins πριν στηθεί η γέφυρα
        registerPlugin(DriveAuthPlugin.class);
        registerPlugin(SpeechPlugin.class);
        super.onCreate(savedInstanceState);
        // Σε διαδραστικούς πίνακες (π.χ. BenQ) το WebView, μετά από λεπτά χωρίς γράψιμο, πετούσε ό,τι είχε έτοιμο για την οθόνη
        // και η πρώτη γραμμή αργούσε να φανεί· ο Chrome στην ίδια συσκευή δεν το κάνει. Κρατάμε τη σελίδα έτοιμη στη μνήμη
        // και τον renderer σε υψηλή προτεραιότητα.
        WebView wv = getBridge().getWebView();
        wv.getSettings().setOffscreenPreRaster(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) wv.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
    }
}
