import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_ALIAS = 'yakir.db.key.v1';
const KEY_BYTES = 32;

const STORE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

export async function getOrCreateDbKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_ALIAS, STORE_OPTIONS);
  if (existing) {
    return existing;
  }

  const key = toHex(await Crypto.getRandomBytesAsync(KEY_BYTES));
  await SecureStore.setItemAsync(KEY_ALIAS, key, STORE_OPTIONS);
  return key;
}

export async function deleteDbKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_ALIAS, STORE_OPTIONS);
}
