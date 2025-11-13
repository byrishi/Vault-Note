// services/cryptoService.ts

// Helper function to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Helper function to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates a cryptographically secure 256-bit (32-byte) key
 * and returns it as a Base64 encoded string for easy storage and sharing.
 */
export const generateKey = (): string => {
  const keyBytes = new Uint8Array(32);
  window.crypto.getRandomValues(keyBytes);
  return bufferToBase64(keyBytes);
};

/**
 * Imports a raw key from a Base64 string into a CryptoKey object.
 */
const importKey = (keyB64: string): Promise<CryptoKey> => {
  const keyBytes = base64ToBuffer(keyB64);
  return window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    true, // can be used for both encryption and decryption
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a plaintext string using AES-GCM.
 * @param text The plaintext to encrypt.
 * @param keyB64 The Base64 encoded 256-bit key.
 * @returns A JSON string containing the base64-encoded IV and ciphertext.
 */
export const encryptText = async (text: string, keyB64: string): Promise<string> => {
  if (!text || !keyB64) {
    throw new Error("Text and key are required for encryption.");
  }

  const cryptoKey = await importKey(keyB64);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits is recommended for GCM
  const encodedText = new TextEncoder().encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    encodedText
  );
  
  // Package the IV and ciphertext together in a structured format.
  const encryptedPackage = {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
    version: 1,
  };

  return JSON.stringify(encryptedPackage);
};


/**
 * Decrypts a structured JSON string using AES-GCM.
 * @param encryptedPackageJson The JSON string from the .vault file.
 * @param keyB64 The Base64 encoded 256-bit key.
 * @returns The original plaintext string.
 */
export const decryptText = async (encryptedPackageJson: string, keyB64: string): Promise<string> => {
  if (!encryptedPackageJson || !keyB64) {
    throw new Error("Ciphertext and key are required for decryption.");
  }

  try {
    const encryptedPackage = JSON.parse(encryptedPackageJson);
    if (!encryptedPackage.iv || !encryptedPackage.ciphertext) {
      throw new Error("Invalid encrypted file format.");
    }

    const cryptoKey = await importKey(keyB64);
    const iv = base64ToBuffer(encryptedPackage.iv);
    const ciphertext = base64ToBuffer(encryptedPackage.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      cryptoKey,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error("Decryption failed:", e);
    throw new Error("Decryption failed. The key might be incorrect or the file may be corrupted.");
  }
};
