'use client';

/**
 * WebAuthn Passkey Browser Client Helpers
 * Implements W3C WebAuthn Level 3 (JSON serialization / deserialization)
 * with robust ArrayBuffer fallbacks for complete cross-browser compatibility.
 */

export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    typeof window.PublicKeyCredential !== 'undefined' &&
    navigator.credentials &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * Convert base64 / base64url string to Uint8Array
 */
export function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array / ArrayBuffer to base64url string
 */
export function uint8ArrayToBase64Url(bytes: Uint8Array | ArrayBuffer): string {
  const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Parse registration/creation options returned by Supabase (/passkeys/registration/options)
 * into CredentialCreationOptions ready for navigator.credentials.create()
 *
 * NOTE: navigator.credentials.create() requires { publicKey: PublicKeyCredentialCreationOptions }
 * Native PublicKeyCredential.parseCreationOptionsFromJSON returns PublicKeyCredentialCreationOptions
 * which must be wrapped inside { publicKey: ... }!
 */
export function parseCreationOptions(options: Record<string, unknown>): CredentialCreationOptions {
  // If options is already wrapped in { publicKey: ... }, unwrap it for Level 3 JSON parsing
  const rawJson = (
    options?.publicKey && typeof options.publicKey === 'object'
      ? options.publicKey
      : options
  ) as Record<string, unknown>;

  // Use native Level 3 parseCreationOptionsFromJSON if available
  if (
    typeof PublicKeyCredential !== 'undefined' &&
    'parseCreationOptionsFromJSON' in PublicKeyCredential &&
    typeof (PublicKeyCredential as unknown as { parseCreationOptionsFromJSON?: (opts: unknown) => PublicKeyCredentialCreationOptions }).parseCreationOptionsFromJSON === 'function'
  ) {
    try {
      const parsed = (PublicKeyCredential as unknown as { parseCreationOptionsFromJSON: (opts: unknown) => PublicKeyCredentialCreationOptions }).parseCreationOptionsFromJSON(rawJson);
      // Guarantee it is wrapped in { publicKey: ... }
      const unwrapped = (parsed as { publicKey?: PublicKeyCredentialCreationOptions }).publicKey || parsed;
      return { publicKey: unwrapped };
    } catch (e) {
      console.warn('Native parseCreationOptionsFromJSON failed, falling back to manual parser:', e);
    }
  }

  // Manual fallback parsing
  const challengeStr = String(rawJson.challenge || '');
  const challenge = base64UrlToUint8Array(challengeStr).buffer as ArrayBuffer;

  const rawUser = (rawJson.user as { id?: string; name?: string; displayName?: string }) || {};
  const user = {
    ...rawUser,
    id: base64UrlToUint8Array(String(rawUser.id || '')).buffer as ArrayBuffer,
  };

  const rawExclude = (rawJson.excludeCredentials as Array<{ id: string; type?: string; transports?: AuthenticatorTransport[] }>) || [];
  const excludeCredentials = rawExclude.map((cred) => ({
    ...cred,
    id: base64UrlToUint8Array(cred.id).buffer as ArrayBuffer,
    type: (cred.type || 'public-key') as PublicKeyCredentialType,
    transports: cred.transports,
  }));

  const restOptions = { ...rawJson };
  delete restOptions.challenge;
  delete restOptions.user;
  delete restOptions.excludeCredentials;

  return {
    publicKey: {
      ...restOptions,
      challenge,
      user: user as PublicKeyCredentialUserEntity,
      ...(excludeCredentials.length > 0 ? { excludeCredentials } : {}),
    } as PublicKeyCredentialCreationOptions,
  };
}

/**
 * Serialize credential created by navigator.credentials.create()
 * into JSON payload expected by Supabase (/passkeys/registration/verify)
 */
export function serializeCreationResponse(credential: PublicKeyCredential): Record<string, unknown> {
  // Use native toJSON if available
  if ('toJSON' in credential && typeof (credential as unknown as { toJSON?: () => Record<string, unknown> }).toJSON === 'function') {
    try {
      return (credential as unknown as { toJSON: () => Record<string, unknown> }).toJSON();
    } catch (e) {
      console.warn('Native credential.toJSON() failed, falling back to manual serializer:', e);
    }
  }

  const response = credential.response as AuthenticatorAttestationResponse;
  const transports = typeof response.getTransports === 'function' ? response.getTransports() : undefined;

  return {
    id: credential.id,
    rawId: credential.id,
    type: credential.type,
    response: {
      attestationObject: uint8ArrayToBase64Url(response.attestationObject),
      clientDataJSON: uint8ArrayToBase64Url(response.clientDataJSON),
      ...(transports ? { transports } : {}),
    },
    clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
    authenticatorAttachment: (credential as unknown as { authenticatorAttachment?: string }).authenticatorAttachment,
  };
}

/**
 * Parse authentication options returned by Supabase (/passkeys/authentication/options)
 * into CredentialRequestOptions ready for navigator.credentials.get()
 *
 * NOTE: navigator.credentials.get() requires { publicKey: PublicKeyCredentialRequestOptions }
 * Native PublicKeyCredential.parseRequestOptionsFromJSON returns PublicKeyCredentialRequestOptions
 * which must be wrapped inside { publicKey: ... }!
 */
export function parseRequestOptions(options: Record<string, unknown>): CredentialRequestOptions {
  // If options is already wrapped in { publicKey: ... }, unwrap it for Level 3 JSON parsing
  const rawJson = (
    options?.publicKey && typeof options.publicKey === 'object'
      ? options.publicKey
      : options
  ) as Record<string, unknown>;

  // Use native Level 3 parseRequestOptionsFromJSON if available
  if (
    typeof PublicKeyCredential !== 'undefined' &&
    'parseRequestOptionsFromJSON' in PublicKeyCredential &&
    typeof (PublicKeyCredential as unknown as { parseRequestOptionsFromJSON?: (opts: unknown) => PublicKeyCredentialRequestOptions }).parseRequestOptionsFromJSON === 'function'
  ) {
    try {
      const parsed = (PublicKeyCredential as unknown as { parseRequestOptionsFromJSON: (opts: unknown) => PublicKeyCredentialRequestOptions }).parseRequestOptionsFromJSON(rawJson);
      // Guarantee it is wrapped in { publicKey: ... }
      const unwrapped = (parsed as { publicKey?: PublicKeyCredentialRequestOptions }).publicKey || parsed;
      return { publicKey: unwrapped };
    } catch (e) {
      console.warn('Native parseRequestOptionsFromJSON failed, falling back to manual parser:', e);
    }
  }

  // Manual fallback parsing
  const challengeStr = String(rawJson.challenge || '');
  const challenge = base64UrlToUint8Array(challengeStr).buffer as ArrayBuffer;

  const rawAllow = (rawJson.allowCredentials as Array<{ id: string; type?: string; transports?: AuthenticatorTransport[] }>) || [];
  const allowCredentials = rawAllow.map((cred) => ({
    ...cred,
    id: base64UrlToUint8Array(cred.id).buffer as ArrayBuffer,
    type: (cred.type || 'public-key') as PublicKeyCredentialType,
    transports: cred.transports,
  }));

  const restOptions = { ...rawJson };
  delete restOptions.challenge;
  delete restOptions.allowCredentials;

  return {
    publicKey: {
      ...restOptions,
      challenge,
      ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
    } as PublicKeyCredentialRequestOptions,
  };
}

/**
 * Serialize credential assertion from navigator.credentials.get()
 * into JSON payload expected by Supabase (/passkeys/authentication/verify)
 */
export function serializeRequestResponse(credential: PublicKeyCredential): Record<string, unknown> {
  // Use native toJSON if available
  if ('toJSON' in credential && typeof (credential as unknown as { toJSON?: () => Record<string, unknown> }).toJSON === 'function') {
    try {
      return (credential as unknown as { toJSON: () => Record<string, unknown> }).toJSON();
    } catch (e) {
      console.warn('Native credential.toJSON() failed, falling back to manual serializer:', e);
    }
  }

  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: credential.id,
    type: credential.type,
    response: {
      authenticatorData: uint8ArrayToBase64Url(response.authenticatorData),
      clientDataJSON: uint8ArrayToBase64Url(response.clientDataJSON),
      signature: uint8ArrayToBase64Url(response.signature),
      userHandle: response.userHandle ? uint8ArrayToBase64Url(response.userHandle) : undefined,
    },
    clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
    authenticatorAttachment: (credential as unknown as { authenticatorAttachment?: string }).authenticatorAttachment,
  };
}
