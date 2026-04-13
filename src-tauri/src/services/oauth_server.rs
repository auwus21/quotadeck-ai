//! Local HTTP server for capturing OAuth callbacks.
//!
//! Starts a temporary TCP listener on a random port, waits for
//! Google's OAuth redirect, extracts the authorization code,
//! and shuts down. This avoids the need for a persistent web server.

use std::sync::{Arc, Mutex};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

use crate::error::AppError;
use crate::services::oauth;

/// Result of a successful OAuth callback capture.
pub struct OAuthCallbackResult {
    /// The authorization code from Google
    pub code: String,
    /// The redirect URI that was used (needed for token exchange)
    pub redirect_uri: String,
}

/// Shared state for cancellation support.
static CANCEL_FLAG: Mutex<bool> = Mutex::new(false);

/// Cancel any pending OAuth flow.
pub fn cancel() {
    if let Ok(mut flag) = CANCEL_FLAG.lock() {
        *flag = true;
    }
}

fn is_cancelled() -> bool {
    CANCEL_FLAG.lock().map(|f| *f).unwrap_or(false)
}

fn reset_cancel() {
    if let Ok(mut flag) = CANCEL_FLAG.lock() {
        *flag = false;
    }
}

/// Prepares the OAuth URL by binding a local server.
///
/// Returns `(auth_url, port)` — the URL to open in the browser
/// and the port the local server is listening on.
pub async fn prepare_oauth_url() -> Result<(String, u16), AppError> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| AppError::Platform(format!("Failed to bind local server: {}", e)))?;

    let port = listener
        .local_addr()
        .map_err(|e| AppError::Platform(format!("Failed to get local address: {}", e)))?
        .port();

    let redirect_uri = format!("http://localhost:{}", port);
    let auth_url = oauth::build_auth_url(&redirect_uri);

    // Drop the listener — we'll re-bind when waiting for the callback
    drop(listener);

    Ok((auth_url, port))
}

/// Starts a local HTTP server and waits for the OAuth callback.
///
/// This function blocks until either:
/// - A callback with an authorization code is received
/// - The flow is cancelled
/// - A timeout of 5 minutes is reached
pub async fn wait_for_callback(port: u16) -> Result<OAuthCallbackResult, AppError> {
    reset_cancel();

    let redirect_uri = format!("http://localhost:{}", port);

    let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .map_err(|e| AppError::Platform(format!("Failed to bind port {}: {}", port, e)))?;

    let timeout = tokio::time::Duration::from_secs(300); // 5 minute timeout

    let result = tokio::time::timeout(timeout, async {
        loop {
            if is_cancelled() {
                return Err(AppError::Platform("OAuth flow cancelled by user".into()));
            }

            // Accept with a short timeout to check cancellation periodically
            let accept_result = tokio::time::timeout(
                tokio::time::Duration::from_secs(2),
                listener.accept(),
            )
            .await;

            let (mut stream, _addr) = match accept_result {
                Ok(Ok(conn)) => conn,
                Ok(Err(e)) => {
                    return Err(AppError::Platform(format!("Accept error: {}", e)));
                }
                Err(_) => {
                    // Timeout on accept — loop back to check cancellation
                    continue;
                }
            };

            // Read the HTTP request
            let mut buf = vec![0u8; 4096];
            let n = stream
                .read(&mut buf)
                .await
                .map_err(|e| AppError::Platform(format!("Read error: {}", e)))?;

            let request = String::from_utf8_lossy(&buf[..n]);

            // Extract the request path from the first line
            // e.g., "GET /?code=4/0AXE...&scope=... HTTP/1.1"
            let first_line = request.lines().next().unwrap_or("");
            let path = first_line
                .split_whitespace()
                .nth(1)
                .unwrap_or("/");

            // Parse query parameters
            let full_url = format!("http://localhost:{}{}", port, path);
            let parsed = url::Url::parse(&full_url).ok();

            let code = parsed.as_ref().and_then(|u| {
                u.query_pairs()
                    .find(|(k, _)| k == "code")
                    .map(|(_, v)| v.to_string())
            });

            let error = parsed.as_ref().and_then(|u| {
                u.query_pairs()
                    .find(|(k, _)| k == "error")
                    .map(|(_, v)| v.to_string())
            });

            if let Some(error) = error {
                // Send error response to browser
                let html = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n\
                    <html><body style='font-family:system-ui;display:flex;align-items:center;\
                    justify-content:center;height:100vh;margin:0;background:#0a0a0f;color:#ff6b6b'>\
                    <div style='text-align:center'>\
                    <h1>❌ Authorization Failed</h1>\
                    <p>Error: {}</p>\
                    <p>You can close this tab.</p>\
                    </div></body></html>",
                    error
                );
                let _ = stream.write_all(html.as_bytes()).await;
                let _ = stream.shutdown().await;
                return Err(AppError::Platform(format!("OAuth denied: {}", error)));
            }

            if let Some(code) = code {
                // Send success response to browser
                let html =
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n\
                    <html><body style='font-family:system-ui;display:flex;align-items:center;\
                    justify-content:center;height:100vh;margin:0;background:#0a0a0f;color:#22c55e'>\
                    <div style='text-align:center'>\
                    <h1>✅ Authorization Successful!</h1>\
                    <p>You can close this tab and return to QuotaDeck AI.</p>\
                    </div></body></html>";
                let _ = stream.write_all(html.as_bytes()).await;
                let _ = stream.shutdown().await;

                return Ok(OAuthCallbackResult {
                    code,
                    redirect_uri: redirect_uri.clone(),
                });
            }

            // Not an OAuth callback — send a simple response and keep waiting
            let html = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nWaiting for OAuth...";
            let _ = stream.write_all(html.as_bytes()).await;
            let _ = stream.shutdown().await;
        }
    })
    .await;

    match result {
        Ok(inner) => inner,
        Err(_) => Err(AppError::Platform(
            "OAuth flow timed out (5 minutes). Please try again.".into(),
        )),
    }
}

/// Validates a manually-pasted callback URL and extracts the code.
pub fn extract_code_from_callback_url(callback_url: &str) -> Result<String, AppError> {
    let parsed = url::Url::parse(callback_url)
        .map_err(|_| AppError::Platform("Invalid callback URL".into()))?;

    let code = parsed
        .query_pairs()
        .find(|(k, _)| k == "code")
        .map(|(_, v)| v.to_string())
        .ok_or_else(|| {
            AppError::Platform(
                "No authorization code found in the URL. \
                 Make sure you paste the complete redirect URL."
                    .into(),
            )
        })?;

    Ok(code)
}
