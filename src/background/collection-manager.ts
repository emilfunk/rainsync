import { RaindropApi } from './raindrop-api';
import { logger } from '../shared/utils/logger';
import { getStorage, setStorage } from '../shared/utils/storage';
import { PLATFORM_COLLECTION_NAMES, RAINDROP_COLLECTION_NAME } from '../shared/constants/api';
import { PlatformType } from '../shared/types/tweet';

export class CollectionManager {
  constructor(private api: RaindropApi) {}

  /**
   * Ensure collection exists for a given platform (Twitter, YouTube, Instagram, LinkedIn)
   * Returns the collection ID, creating it if necessary
   * Caches the ID in storage for performance
   */
  async ensureCollection(platform: PlatformType = 'twitter'): Promise<number> {
    const collectionName = PLATFORM_COLLECTION_NAMES[platform] || RAINDROP_COLLECTION_NAME;
    const storageKey = platform === 'twitter' ? 'collectionId' : (`collectionId_${platform}` as any);

    // Check if we have a cached collection ID
    const cachedId = await getStorage(storageKey);
    if (cachedId) {
      logger.debug('Using cached collection ID', { platform, id: cachedId });
      try {
        const collections = await this.api.getCollections();
        const exists = collections.some((c) => c._id === cachedId);
        if (exists) {
          return cachedId;
        }
        logger.warn('Cached collection no longer exists, will recreate', { platform });
      } catch (error) {
        logger.warn('Failed to verify cached collection', { platform, error });
      }
    }

    // Try to find the collection
    logger.info('Looking for collection', { name: collectionName, platform });
    const existingId = await this.api.findCollectionByName(collectionName);

    if (existingId) {
      logger.info('Found existing collection', { id: existingId, platform });
      await setStorage(storageKey, existingId);
      return existingId;
    }

    // Collection doesn't exist, create it
    logger.info('Creating new collection', { name: collectionName, platform });
    const newId = await this.api.createCollection(collectionName);
    await setStorage(storageKey, newId);
    return newId;
  }

  /**
   * Clear the cached collection ID
   * Useful if the collection is deleted or needs to be recreated
   */
  async clearCache(platform?: PlatformType): Promise<void> {
    if (platform) {
      const storageKey = platform === 'twitter' ? 'collectionId' : (`collectionId_${platform}` as any);
      await setStorage(storageKey, undefined);
    } else {
      await setStorage('collectionId', undefined);
      for (const p of ['youtube', 'instagram', 'linkedin'] as PlatformType[]) {
        await setStorage(`collectionId_${p}` as any, undefined);
      }
    }
    logger.info('Cleared collection cache', { platform });
  }
}
