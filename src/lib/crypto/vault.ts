import crypto from 'node:crypto';

let hasLoggedMissingKeyWarning = false;
let hasLoggedDecryptionFailure = false;

/**
 * Validates and decodes a base64 32-byte encryption key.
 */
function parseKey(raw?: string): Buffer | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const buf = Buffer.from(trimmed, 'base64');
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the primary AES-256-GCM key derived ONLY from VAULT_ENCRYPTION_KEY.
 * Returns null if the variable is missing or invalid.
 */
function getActiveKey(): Buffer | null {
  const key = parseKey(process.env.VAULT_ENCRYPTION_KEY);
  if (!key) {
    if (!hasLoggedMissingKeyWarning) {
      hasLoggedMissingKeyWarning = true;
      console.warn(
        '[Vault] VAULT_ENCRYPTION_KEY is missing or invalid (expected 32-byte base64). Running unencrypted.'
      );
    }
    return null;
  }
  return key;
}

/**
 * Retrieves the previous rotation key if configured via VAULT_ENCRYPTION_KEY_PREVIOUS.
 */
function getPreviousKey(): Buffer | null {
  return parseKey(process.env.VAULT_ENCRYPTION_KEY_PREVIOUS);
}

/**
 * Computes a short 8-hex-character identifier for a key to embed in enc:v2 format.
 */
function getKeyId(keyBuf: Buffer): string {
  return crypto.createHash('sha256').update(keyBuf).digest('hex').slice(0, 8);
}

/**
 * Legacy derivation used strictly for reading existing enc:v1 values.
 */
function getLegacyV1Key(): Buffer {
  const secretSource =
    process.env.VAULT_ENCRYPTION_KEY ||
    process.env.CONTACT_RATE_LIMIT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_USER_ID ||
    'folioframe-internal-default-vault-key-salt-32b';

  return crypto.createHash('sha256').update(secretSource).digest();
}

/**
 * Checks whether a given string is encrypted with the vault scheme (v1 or v2).
 */
export function isVaultEncrypted(value?: string | null): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('enc:v2:') || value.startsWith('enc:v1:');
}

/**
 * Check whether a valid 32-byte base64 VAULT_ENCRYPTION_KEY is available.
 */
export function isVaultKeyConfigured(): boolean {
  return parseKey(process.env.VAULT_ENCRYPTION_KEY) !== null;
}

/**
 * Returns a human-readable warning message if VAULT_ENCRYPTION_KEY is missing or invalid.
 */
export function getVaultWarning(): string | null {
  const raw = process.env.VAULT_ENCRYPTION_KEY?.trim();
  if (!raw) {
    return 'VAULT_ENCRYPTION_KEY is not set. Secrets are stored unencrypted in app_settings. Set a 32-byte base64 key in your environment to enable AES-256-GCM encryption.';
  }
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== 32) {
      return `VAULT_ENCRYPTION_KEY is invalid (decoded to ${buf.length} bytes, expected 32 bytes). Secrets are stored unencrypted.`;
    }
  } catch {
    return 'VAULT_ENCRYPTION_KEY is not valid base64. Secrets are stored unencrypted.';
  }
  return null;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:v2:<keyid>:<iv_hex>:<tag_hex>:<ciphertext_hex>
 *
 * If VAULT_ENCRYPTION_KEY is missing or invalid:
 * - Does NOT encrypt.
 * - Stores plaintext.
 * - Logs one warning without values.
 */
export function encryptVaultValue(plaintext: string): string {
  if (!plaintext) return '';
  // Avoid re-encrypting if already encrypted
  if (isVaultEncrypted(plaintext)) return plaintext;

  const key = getActiveKey();
  if (!key) {
    // Missing or invalid key: store plaintext safely
    return plaintext;
  }

  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const keyId = getKeyId(key);

  return `enc:v2:${keyId}:${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Decrypts an encrypted vault string.
 * Supports:
 * - enc:v2:<keyid>:<iv>:<tag>:<ct> using active key, falling back to VAULT_ENCRYPTION_KEY_PREVIOUS
 * - enc:v1:<iv>:<tag>:<ct> using legacy fallback derivation for already-written values
 * - Plaintext: returns unchanged
 */
export function decryptVaultValue(value?: string | null): string {
  if (!value) return '';
  if (!isVaultEncrypted(value)) {
    return value; // Existing plaintext values read cleanly
  }

  const parts = value.split(':');

  // Handle v2 format: enc:v2:<keyid>:<iv>:<tag>:<ct>
  if (parts[0] === 'enc' && parts[1] === 'v2') {
    if (parts.length !== 6) return value;
    const [, , , ivHex, tagHex, ctHex] = parts;

    const keysToTry: Buffer[] = [];
    const activeKey = getActiveKey();
    if (activeKey) keysToTry.push(activeKey);

    const prevKey = getPreviousKey();
    if (prevKey) keysToTry.push(prevKey);

    for (const key of keysToTry) {
      try {
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const ciphertext = Buffer.from(ctHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([
          decipher.update(ciphertext),
          decipher.final(),
        ]);

        return decrypted.toString('utf8');
      } catch {
        // Try next key if available
      }
    }

    if (!hasLoggedDecryptionFailure) {
      hasLoggedDecryptionFailure = true;
      console.error('[Vault] Decryption failed for enc:v2 payload (key mismatch or integrity check failed).');
    }
    return value;
  }

  // Handle legacy v1 format: enc:v1:<iv>:<tag>:<ct>
  if (parts[0] === 'enc' && parts[1] === 'v1') {
    if (parts.length !== 5) return value;
    try {
      const iv = Buffer.from(parts[2], 'hex');
      const tag = Buffer.from(parts[3], 'hex');
      const ciphertext = Buffer.from(parts[4], 'hex');

      const legacyKey = getLegacyV1Key();
      const decipher = crypto.createDecipheriv('aes-256-gcm', legacyKey, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch {
      if (!hasLoggedDecryptionFailure) {
        hasLoggedDecryptionFailure = true;
        console.error('[Vault] Decryption failed for legacy enc:v1 payload.');
      }
      return value;
    }
  }

  return value;
}

/**
 * Masks a secret value, returning only the last 4 characters.
 * Format: ••••••••••••${last4}
 */
export function maskSecretValue(val?: string, isSecret = true): string {
  if (!val) return '';
  if (!isSecret) return val;
  const clearVal = isVaultEncrypted(val) ? decryptVaultValue(val) : val;
  if (clearVal.length <= 4) return '••••••••';
  return `••••••••••••${clearVal.slice(-4)}`;
}
