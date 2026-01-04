import { RaindropApi } from './raindrop-api';
import { logger } from '../shared/utils/logger';
import { getStorage, setStorage } from '../shared/utils/storage';
import { RAINDROP_COLLECTION_NAME } from '../shared/constants/api';

export class CollectionManager {
  constructor(private api: RaindropApi) {}

  /**
   * Ensure the "Twitter Bookmarks" collection exists
   * Returns the collection ID, creating it if necessary
   * Caches the ID in storage for performance
   */
  async ensureCollection(): Promise<number> {
    // Check if we have a cached collection ID
    const cachedId = await getStorage('collectionId');
    if (cachedId) {
      logger.debug('Using cached collection ID', { id: cachedId });
      // Verify it still exists
      try {
        const collections = await this.api.getCollections();
        const exists = collections.some((c) => c._id === cachedId);
        if (exists) {
          return cachedId;
        }
        logger.warn('Cached collection no longer exists, will recreate');
      } catch (error) {
        logger.warn('Failed to verify cached collection', { error });
      }
    }

    // Try to find the collection
    logger.info('Looking for collection', { name: RAINDROP_COLLECTION_NAME });
    const existingId = await this.api.findCollectionByName(RAINDROP_COLLECTION_NAME);

    if (existingId) {
      logger.info('Found existing collection', { id: existingId });
      await setStorage('collectionId', existingId);
      return existingId;
    }

    // Collection doesn't exist, create it
    logger.info('Creating new collection', { name: RAINDROP_COLLECTION_NAME });
    const newId = await this.api.createCollection(RAINDROP_COLLECTION_NAME);
    await setStorage('collectionId', newId);
    return newId;
  }

  /**
   * Clear the cached collection ID
   * Useful if the collection is deleted or needs to be recreated
   */
  async clearCache(): Promise<void> {
    await setStorage('collectionId', undefined);
    logger.info('Cleared collection cache');
  }
}
