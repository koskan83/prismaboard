package gr.klabs.prismaboard;

import android.app.Activity;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;
import java.util.Collections;

/**
 * Σύνδεση με το Google Drive από την εφαρμογή Android. Μέσα σε WebView η Google δεν επιτρέπει τη σύνδεση της σελίδας
 * (Google Identity Services), οπότε το access token για το drive.file το δίνουν οι υπηρεσίες Google της συσκευής
 * (AuthorizationClient). Οι κλήσεις στο Drive μένουν ίδιες, στη src/drive.ts.
 */
@CapacitorPlugin(name = "DriveAuth")
public class DriveAuthPlugin extends Plugin {

    private static final String DRIVE_FILE = "https://www.googleapis.com/auth/drive.file";

    /** Το παράθυρο συναίνεσης της Google, όταν χρειάζεται (την πρώτη φορά ή αν ανακλήθηκε η πρόσβαση). */
    private ActivityResultLauncher<IntentSenderRequest> consent;
    private PluginCall waiting;

    @Override
    public void load() {
        consent = getBridge().registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), this::onConsent);
    }

    private AuthorizationRequest request() {
        return AuthorizationRequest.builder().setRequestedScopes(Collections.singletonList(new Scope(DRIVE_FILE))).build();
    }

    /** Επιστρέφει { accessToken }. `interactive: false`: χωρίς παράθυρο, μόνο αν η πρόσβαση έχει ήδη δοθεί. */
    @PluginMethod
    public void authorize(PluginCall call) {
        boolean interactive = call.getBoolean("interactive", true);
        Identity.getAuthorizationClient(getActivity())
            .authorize(request())
            .addOnSuccessListener((result) -> {
                if (!result.hasResolution()) {
                    resolve(call, result);
                    return;
                }
                if (!interactive || result.getPendingIntent() == null) {
                    call.reject("Χρειάζεται σύνδεση με το Google Drive", "NEEDS_CONSENT");
                    return;
                }
                if (waiting != null) waiting.reject("Ακυρώθηκε", "CANCELLED");
                waiting = call;
                consent.launch(new IntentSenderRequest.Builder(result.getPendingIntent().getIntentSender()).build());
            })
            .addOnFailureListener((e) -> call.reject(message(e), "FAILED", e));
    }

    private void onConsent(ActivityResult r) {
        PluginCall call = waiting;
        waiting = null;
        if (call == null) return;
        if (r.getResultCode() != Activity.RESULT_OK || r.getData() == null) {
            call.reject("Η σύνδεση με το Google Drive ακυρώθηκε", "CANCELLED");
            return;
        }
        try {
            resolve(call, Identity.getAuthorizationClient(getActivity()).getAuthorizationResultFromIntent(r.getData()));
        } catch (ApiException e) {
            call.reject(message(e), "FAILED", e);
        }
    }

    private void resolve(PluginCall call, AuthorizationResult result) {
        String token = result.getAccessToken();
        if (token == null) {
            call.reject("Η Google δεν έδωσε πρόσβαση στο Drive", "FAILED");
            return;
        }
        JSObject out = new JSObject();
        out.put("accessToken", token);
        call.resolve(out);
    }

    /** Συσκευή χωρίς υπηρεσίες Google (π.χ. κάποιοι διαδραστικοί πίνακες): καθαρό μήνυμα αντί για κωδικό σφάλματος. */
    private String message(Exception e) {
        if (e instanceof ApiException && ((ApiException) e).getStatusCode() == 17) {
            return "Η συσκευή δεν έχει τις υπηρεσίες Google που χρειάζεται το Drive";
        }
        return "Η σύνδεση με το Google Drive απέτυχε: " + e.getMessage();
    }
}
