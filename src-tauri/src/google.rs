//! Σύνδεση με το Google Drive στο πρόγραμμα των Windows.
//!
//! Η Google δεν δέχεται το `http://tauri.localhost` ως προέλευση για τη σύνδεση μέσα στη σελίδα (GIS, βλ. src/drive.ts).
//! Γι' αυτό εδώ η σύνδεση γίνεται όπως σε κάθε πρόγραμμα υπολογιστή: ανοίγει ο browser του συστήματος και η Google
//! επιστρέφει τον κωδικό σε μια προσωρινή διεύθυνση `http://127.0.0.1:<θύρα>` (loopback, με PKCE), μέσω του OAuth client
//! τύπου «Desktop app». Το «client secret» ενός τέτοιου client δεν είναι μυστικό για τη Google (βρίσκεται μέσα στο
//! πρόγραμμα)· μπαίνει από το secret GOOGLE_DESKTOP_CLIENT_SECRET του workflow, για να μην είναι στο αποθετήριο.
//!
//! Το refresh token μένει στον φάκελο δεδομένων του προγράμματος, ώστε στις επόμενες φορές το διακριτικό πρόσβασης
//! (περίπου μία ώρα) να ανανεώνεται χωρίς browser. Η σελίδα παίρνει μόνο το διακριτικό πρόσβασης.

use std::time::Duration;

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

/// Το OAuth client «Desktop app» στο ίδιο project του Google Cloud με το Web client: δημόσιο αναγνωριστικό.
const CLIENT_ID: &str = "";
const CLIENT_SECRET: Option<&str> = option_env!("GOOGLE_DESKTOP_CLIENT_SECRET");
const SCOPE: &str = "https://www.googleapis.com/auth/drive.file";
/// Πόσο περιμένουμε να ολοκληρωθεί η σύνδεση στον browser.
const WAIT: Duration = Duration::from_secs(300);

/// Σφάλματα ως κωδικοί: τα μηνύματα (ελληνικά ή αγγλικά) τα γράφει το src/drive.ts.
enum Fail {
    /// Χωρίς ίντερνετ ή άλλο σφάλμα δικτύου.
    Net,
    /// Η Google αρνήθηκε (π.χ. το refresh token ανακλήθηκε).
    Denied,
}

/// Διακριτικό πρόσβασης για το Drive: `{ access_token, expires_in }`.
/// Πρώτα με το αποθηκευμένο refresh token· αλλιώς ανοίγει τον browser για σύνδεση.
#[tauri::command]
pub async fn google_token(app: AppHandle) -> Result<Value, String> {
    if CLIENT_ID.is_empty() {
        return Err("no_client".into());
    }
    if let Some(refresh) = load_refresh(&app) {
        match token_request(&[("grant_type", "refresh_token"), ("refresh_token", &refresh)]).await {
            Ok(t) => return Ok(access(&t)),
            Err(Fail::Net) => return Err("network".into()),
            Err(Fail::Denied) => forget_refresh(&app),
        }
    }
    let t = sign_in().await?;
    if let Some(refresh) = t["refresh_token"].as_str() {
        save_refresh(&app, refresh);
    }
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.unminimize();
        let _ = main.set_focus();
    }
    Ok(access(&t))
}

fn access(t: &Value) -> Value {
    json!({ "access_token": t["access_token"], "expires_in": t["expires_in"] })
}

/// Σύνδεση στον browser του συστήματος (loopback + PKCE) και ανταλλαγή του κωδικού με διακριτικά.
async fn sign_in() -> Result<Value, String> {
    let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let redirect = format!("http://127.0.0.1:{}", listener.local_addr().map_err(|e| e.to_string())?.port());
    let verifier = random(32)?;
    let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));
    let state = random(16)?;
    // prompt=consent: μόνο έτσι η Google ξαναδίνει refresh token σε λογαριασμό που είχε ήδη δώσει πρόσβαση
    let url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&code_challenge={challenge}&code_challenge_method=S256&state={state}&access_type=offline&prompt=consent",
        enc(CLIENT_ID),
        enc(&redirect),
        enc(SCOPE),
    );
    open_browser(&url)?;
    let code = tokio::time::timeout(WAIT, wait_code(&listener, &state)).await.map_err(|_| "timeout".to_string())??;
    match token_request(&[("grant_type", "authorization_code"), ("code", &code), ("code_verifier", &verifier), ("redirect_uri", &redirect)]).await {
        Ok(t) => Ok(t),
        Err(Fail::Net) => Err("network".into()),
        Err(Fail::Denied) => Err("denied".into()),
    }
}

/// Περιμένει την επιστροφή από τη Google στη loopback διεύθυνση και δίνει τον κωδικό.
/// Άλλα αιτήματα του browser (π.χ. favicon) ή με λάθος `state` αγνοούνται.
async fn wait_code(listener: &TcpListener, state: &str) -> Result<String, String> {
    loop {
        let (mut sock, _) = listener.accept().await.map_err(|e| e.to_string())?;
        let mut buf = vec![0u8; 8192];
        let mut len = 0;
        while len < buf.len() {
            let n = match tokio::time::timeout(Duration::from_secs(5), sock.read(&mut buf[len..])).await {
                Ok(Ok(n)) if n > 0 => n,
                _ => break,
            };
            len += n;
            if buf[..len].windows(4).any(|w| w == b"\r\n\r\n") {
                break;
            }
        }
        let head = String::from_utf8_lossy(&buf[..len]);
        let target = head.lines().next().and_then(|l| l.split(' ').nth(1)).unwrap_or("");
        let Some(query) = target.strip_prefix("/?") else {
            reply(&mut sock, "404 Not Found", "").await;
            continue;
        };
        let param = |k: &str| {
            query
                .split('&')
                .filter_map(|p| p.split_once('='))
                .find(|(n, _)| *n == k)
                .map(|(_, v)| crate::percent_decode(&v.replace('+', " ")))
        };
        if param("state").as_deref() != Some(state) {
            reply(&mut sock, "400 Bad Request", "").await;
            continue;
        }
        if let Some(code) = param("code") {
            reply(&mut sock, "200 OK", "Η σύνδεση με το Google Drive έγινε. Μπορείς να κλείσεις αυτή την καρτέλα και να γυρίσεις στο PrismaBoard.<br><br>Connected to Google Drive. You can close this tab and go back to PrismaBoard.").await;
            return Ok(code);
        }
        reply(&mut sock, "200 OK", "Η σύνδεση με το Google Drive ακυρώθηκε. Μπορείς να κλείσεις αυτή την καρτέλα.<br><br>Google Drive sign-in was cancelled. You can close this tab.").await;
        return Err("cancelled".into());
    }
}

async fn reply(sock: &mut tokio::net::TcpStream, status: &str, text: &str) {
    let body = format!(
        "<!doctype html><html lang=\"el\"><meta charset=\"utf-8\"><title>PrismaBoard</title><body style=\"font:18px system-ui,sans-serif;margin:3em auto;max-width:36em;padding:0 1em\">{text}</body></html>"
    );
    let res = format!(
        "HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\nCache-Control: no-store\r\n\r\n{body}",
        body.len()
    );
    let _ = sock.write_all(res.as_bytes()).await;
    let _ = sock.shutdown().await;
}

/// POST στο https://oauth2.googleapis.com/token με τα στοιχεία του client.
async fn token_request(params: &[(&str, &str)]) -> Result<Value, Fail> {
    // όπως στο tauri-plugin-updater: το reqwest είναι χωρίς ενσωματωμένο πάροχο κρυπτογραφίας
    if rustls::crypto::CryptoProvider::get_default().is_none() {
        let _ = rustls::crypto::ring::default_provider().install_default();
    }
    let mut body = format!("client_id={}", enc(CLIENT_ID));
    if let Some(secret) = CLIENT_SECRET.filter(|s| !s.is_empty()) {
        body += &format!("&client_secret={}", enc(secret));
    }
    for (k, v) in params {
        body += &format!("&{k}={}", enc(v));
    }
    let res = reqwest::Client::new()
        .post("https://oauth2.googleapis.com/token")
        .header("content-type", "application/x-www-form-urlencoded")
        .body(body)
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|_| Fail::Net)?;
    let ok = res.status().is_success();
    let text = res.text().await.map_err(|_| Fail::Net)?;
    let t: Value = serde_json::from_str(&text).unwrap_or_default();
    if ok && t["access_token"].is_string() {
        Ok(t)
    } else {
        eprintln!("Google token: {}", t["error"]);
        Err(Fail::Denied)
    }
}

/// Τυχαίο κείμενο base64url από `n` τυχαία bytes (για το PKCE και το `state`).
fn random(n: usize) -> Result<String, String> {
    let mut b = vec![0u8; n];
    getrandom::fill(&mut b).map_err(|e| e.to_string())?;
    Ok(URL_SAFE_NO_PAD.encode(b))
}

/// Κωδικοποίηση για URL και φόρμα: μένουν μόνο οι χαρακτήρες που δεν θέλουν διαφυγή.
fn enc(s: &str) -> String {
    s.bytes()
        .map(|b| if b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.' | b'~') { (b as char).to_string() } else { format!("%{b:02X}") })
        .collect()
}

fn refresh_path(app: &AppHandle) -> Option<std::path::PathBuf> {
    app.path().app_local_data_dir().ok().map(|d| d.join("google-drive-token"))
}

fn load_refresh(app: &AppHandle) -> Option<String> {
    let s = std::fs::read_to_string(refresh_path(app)?).ok()?;
    let s = s.trim().to_string();
    (!s.is_empty()).then_some(s)
}

fn save_refresh(app: &AppHandle, token: &str) {
    if let Some(p) = refresh_path(app) {
        if let Some(dir) = p.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        let _ = std::fs::write(p, token);
    }
}

fn forget_refresh(app: &AppHandle) {
    if let Some(p) = refresh_path(app) {
        let _ = std::fs::remove_file(p);
    }
}

/// Ανοίγει τη διεύθυνση στον προεπιλεγμένο browser.
#[cfg(windows)]
fn open_browser(url: &str) -> Result<(), String> {
    #[link(name = "shell32")]
    extern "system" {
        fn ShellExecuteW(hwnd: *mut std::ffi::c_void, op: *const u16, file: *const u16, params: *const u16, dir: *const u16, show: i32) -> isize;
    }
    let wide = |s: &str| s.encode_utf16().chain(Some(0)).collect::<Vec<u16>>();
    let (op, file) = (wide("open"), wide(url));
    // SW_SHOWNORMAL = 1· επιτυχία όταν η τιμή είναι πάνω από 32
    let r = unsafe { ShellExecuteW(std::ptr::null_mut(), op.as_ptr(), file.as_ptr(), std::ptr::null(), std::ptr::null(), 1) };
    if r > 32 {
        Ok(())
    } else {
        Err("no_browser".into())
    }
}
#[cfg(not(windows))]
fn open_browser(url: &str) -> Result<(), String> {
    std::process::Command::new("xdg-open").arg(url).spawn().map(|_| ()).map_err(|_| "no_browser".to_string())
}
