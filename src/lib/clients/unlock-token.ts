import crypto from 'node:crypto';

const UNLOCK_TTL_SECONDS = 5 * 60; // 5 minutes ephemeral unlock window

function getSigningSecret(): string {
  return (
    process.env.VAULT_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_USER_ID ||
    'folioframe-client-vault-ephemeral-signing-key'
  );
}

export interface UnlockTokenPayload {
  sub: string;
  method: 'totp' | 'aal2' | 'dev_bypass';
  iat: number;
  exp: number;
}

/**
 * Creates a stateless HMAC-SHA256 signed unlock token valid for 5 minutes.
 */
export function createVaultUnlockToken(userId: string, method: UnlockTokenPayload['method']): {
  token: string;
  expiresAt: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + UNLOCK_TTL_SECONDS;
  const payload: UnlockTokenPayload = {
    sub: userId,
    method,
    iat: now,
    exp,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encodedPayload)
    .digest('base64url');

  return {
    token: `${encodedPayload}.${sig}`,
    expiresAt: exp * 1000,
  };
}

/**
 * Verifies a stateless HMAC-SHA256 vault unlock token.
 */
export function verifyVaultUnlockToken(token: string | null): UnlockTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, providedSig] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', getSigningSecret())
      .update(encodedPayload)
      .digest('base64url');

    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as UnlockTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
