/**
 * Hashes a string using SHA-256 (Web Crypto API)
 * @param {string} message - The string to hash (e.g. password)
 * @returns {Promise<string>} - The hex representation of the hash
 */
export async function hashPassword(message) {
  // Convert string to ArrayBuffer
  const msgUint8 = new TextEncoder().encode(message);
  // Hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  // Convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert bytes to hex string
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
