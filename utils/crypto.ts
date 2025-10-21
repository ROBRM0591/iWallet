/**
 * Hashes a string using the browser's SubtleCrypto API (SHA-256).
 * @param input The string to hash.
 * @returns A promise that resolves to the hex-encoded hash string.
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert buffer to hex string
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
