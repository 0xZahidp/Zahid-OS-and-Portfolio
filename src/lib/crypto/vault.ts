import crypto from 'node:crypto';

/**
 * Derives a consistent 32-byte encryption key for AES-256-GCM.
 * Prioritizes VAULT_ENCRYPTION_KEY, with fallback to other server-only secrets.
 */
function getVaultKey(): Buffer {
  const secretSource =
    process.env.VAULT_ENCRYPTION_KEY ||
    process.env.CONTACT_RATE_LIMIT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_USER_ID ||
    'folioframe-internal-default-vault-key-salt-32b';

  return crypto.createHash('sha256').update(secretSource).digest();
}

/**
 * Checks whether a given string is encrypted with the AES-256-GCM vault scheme.
 */
export function isVaultEncrypted(value?: string | null): boolean {
  return typeof value === 'string' && value.startsWith('enc:v1:');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
export function encryptVaultValue(plaintext: string): string {
  if (!plaintext) return '';
  // Avoid double-encryption if already encrypted
  if (isVaultEncrypted(plaintext)) return plaintext;

  const key = getVaultKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Decrypts an encrypted vault string.
 * Gracefully returns original string if it is not encrypted (transparent plaintext fallback).
 */
export function decryptVaultValue(value?: string | null): string {
  if (!value) return '';
  if (!isVaultEncrypted(value)) {
    return value; // Existing plaintext values read cleanly
  }

  const parts = value.split(':');
  if (parts.length !== 5 || parts[0] !== 'enc' || parts[1] !== 'v1') {
    return value;
  }

  try {
    const key = getVaultKey();
    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const ciphertext = Buffer.from(parts[4], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    console.error('[Vault] Decryption failed (integrity or key mismatch)');
    return value;
  }
}

/**
 * Masks a secret value, returning only the last 4 characters.
 * Format: ••••••••••••${last4}
 */
export function maskSecretValue(val?: string, isSecret = true): string {
  if (!val) return '';
  if (!isSecret) return val;
  // If value is vault-encrypted, decrypt it first so the mask reflects actual characters
  const clearVal = isVaultEncrypted(val) ? decryptVaultValue(val) : val;
  if (clearVal.length <= 4) return '••••••••';
  return `••••••••••••${clearVal.slice(-4)}`;
}
