//! Token encryption service.
//!
//! Provides AES-256-GCM encryption for securing refresh tokens
//! before they are stored in the local SQLite database.
//!
//! The encryption key is derived from a machine-specific identifier
//! and stored using a fixed derivation method. For production use,
//! this should be integrated with the OS keychain.

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use rand::RngCore;
use sha2::{Sha256, Digest};

use crate::error::AppError;

/// Derives a 256-bit encryption key from a machine-specific seed.
///
/// Uses SHA-256 to derive a consistent key from the machine's
/// hostname and username. This is a basic approach — a production
/// implementation should use the OS keychain (DPAPI on Windows,
/// Keychain on macOS, Secret Service on Linux).
fn derive_key() -> [u8; 32] {
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "quotadeck".to_string());

    let username = std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .unwrap_or_else(|_| "default".to_string());

    let seed = format!("quotadeck-ai:{}:{}", hostname, username);
    let mut hasher = Sha256::new();
    hasher.update(seed.as_bytes());
    let result = hasher.finalize();

    let mut key = [0u8; 32];
    key.copy_from_slice(&result);
    key
}

/// Encrypts a plaintext string using AES-256-GCM.
///
/// Returns a base64-encoded string containing the nonce (12 bytes)
/// prepended to the ciphertext, suitable for database storage.
///
/// # Arguments
///
/// * `plaintext` - The token or sensitive data to encrypt
///
/// # Returns
///
/// Base64-encoded `nonce || ciphertext`
pub fn encrypt(plaintext: &str) -> Result<String, AppError> {
    let key = derive_key();
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| AppError::Encryption(format!("Failed to create cipher: {}", e)))?;

    // Generate a random 96-bit nonce
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| AppError::Encryption(format!("Encryption failed: {}", e)))?;

    // Prepend nonce to ciphertext for storage
    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    Ok(BASE64.encode(&combined))
}

/// Decrypts a base64-encoded ciphertext (with prepended nonce).
///
/// # Arguments
///
/// * `encrypted` - Base64-encoded string from `encrypt()`
///
/// # Returns
///
/// The original plaintext string
pub fn decrypt(encrypted: &str) -> Result<String, AppError> {
    let key = derive_key();
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| AppError::Encryption(format!("Failed to create cipher: {}", e)))?;

    let combined = BASE64.decode(encrypted)
        .map_err(|e| AppError::Encryption(format!("Invalid base64: {}", e)))?;

    if combined.len() < 12 {
        return Err(AppError::Encryption("Encrypted data too short".to_string()));
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| AppError::Encryption(format!("Decryption failed: {}", e)))?;

    String::from_utf8(plaintext)
        .map_err(|e| AppError::Encryption(format!("Invalid UTF-8: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let original = "my-secret-refresh-token-12345";
        let encrypted = encrypt(original).expect("Encryption should succeed");

        assert_ne!(encrypted, original, "Encrypted text should differ from original");

        let decrypted = decrypt(&encrypted).expect("Decryption should succeed");
        assert_eq!(decrypted, original, "Decrypted text should match original");
    }

    #[test]
    fn test_different_nonces() {
        let original = "same-plaintext";
        let enc1 = encrypt(original).unwrap();
        let enc2 = encrypt(original).unwrap();

        // Different nonces should produce different ciphertext
        assert_ne!(enc1, enc2, "Encryptions should use unique nonces");

        // Both should decrypt to the same value
        assert_eq!(decrypt(&enc1).unwrap(), original);
        assert_eq!(decrypt(&enc2).unwrap(), original);
    }
}
