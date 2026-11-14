/**
 * Hunter.io Email Finder Helper
 * Respects free tier limits and safe error handling
 */
export async function lookupHunterEmail(
  domain: string,
  fullName: string,
  apiKey?: string
): Promise<{ email: string; confidence: 'verified' | 'guessed' } | null> {
  const key = apiKey || process.env.HUNTER_API_KEY;
  if (!key || !domain || !fullName) return null;

  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(
      domain
    )}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(
      lastName
    )}&api_key=${key}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    if (json?.data?.email) {
      return {
        email: json.data.email,
        confidence: json.data.score >= 80 ? 'verified' : 'guessed',
      };
    }
  } catch (err) {
    console.warn('[Hunter.io] Lookup error:', err);
  }

  return null;
}

