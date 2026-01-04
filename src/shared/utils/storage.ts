import { StorageSchema } from '../types/storage';

/**
 * Type-safe wrapper around chrome.storage.local.get
 */
export async function getStorage<K extends keyof StorageSchema>(
  key: K
): Promise<StorageSchema[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

/**
 * Type-safe wrapper around chrome.storage.local.set
 */
export async function setStorage<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

/**
 * Get all storage data
 */
export async function getAllStorage(): Promise<Partial<StorageSchema>> {
  return (await chrome.storage.local.get(null)) as Partial<StorageSchema>;
}

/**
 * Clear all storage data (use with caution)
 */
export async function clearStorage(): Promise<void> {
  await chrome.storage.local.clear();
}

/**
 * Remove specific key from storage
 */
export async function removeStorage<K extends keyof StorageSchema>(key: K): Promise<void> {
  await chrome.storage.local.remove(key);
}
