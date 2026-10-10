import {
  RaindropBookmark,
  RaindropCollection,
  RaindropApiResponse,
  RaindropApiError,
  RateLimitError,
  AuthError,
  NetworkError,
} from '../shared/types/raindrop';
import { logger } from '../shared/utils/logger';
import { RAINDROP_API_BASE } from '../shared/constants/api';

export class RaindropApi {
  private token: string | null = null;

  /**
   * Set the authentication token
   */
  setToken(token: string): void {
    this.token = token;
    logger.info('Raindrop API token set');
  }

  /**
   * Validate the authentication token by making a test API call
   */
  async authenticate(token: string): Promise<boolean> {
    this.token = token;

    try {
      // Test the token by fetching user info
      const response = await this.request<{ result: boolean; user?: { email?: string } }>('/user');
      logger.info('Raindrop authentication successful', { user: response.user?.email });
      return response.result;
    } catch (error) {
      logger.error('Raindrop authentication failed', error as Error);
      this.token = null;
      return false;
    }
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<RaindropCollection[]> {
    const response = await this.request<RaindropApiResponse<RaindropCollection>>('/collections');

    if (!response.result || !response.items) {
      throw new RaindropApiError('Failed to fetch collections');
    }

    return response.items;
  }

  /**
   * Find a collection by name
   */
  async findCollectionByName(name: string): Promise<number | null> {
    const collections = await this.getCollections();
    const collection = collections.find((c) => c.title === name);
    return collection?._id ?? null;
  }

  /**
   * Create a new collection
   */
  async createCollection(name: string): Promise<number> {
    const response = await this.request<RaindropApiResponse<RaindropCollection>>(
      '/collection',
      {
        method: 'POST',
        body: JSON.stringify({
          title: name,
          public: false,
        }),
      }
    );

    if (!response.result || !response.item) {
      throw new RaindropApiError('Failed to create collection');
    }

    logger.info('Created Raindrop collection', { name, id: response.item._id });
    return response.item._id;
  }

  /**
   * Check if a bookmark with the given URL already exists in the collection
   */
  async checkDuplicate(url: string, collectionId: number): Promise<boolean> {
    try {
      // Search for bookmarks with this URL in the collection
      const response = await this.request<RaindropApiResponse<{ link: string }>>(
        `/raindrops/${collectionId}?search=${encodeURIComponent(url)}`
      );

      if (!response.result || !response.items) {
        return false;
      }

      // Check if any item has an exact URL match
      const exists = response.items.some((item) => item.link === url);
      return exists;
    } catch (error) {
      logger.warn('Error checking for duplicate', { url, error });
      return false;
    }
  }

  /**
   * Create a new bookmark
   */
  async createBookmark(bookmark: RaindropBookmark): Promise<void> {
    const response = await this.request<RaindropApiResponse<unknown>>('/raindrop', {
      method: 'POST',
      body: JSON.stringify(bookmark),
    });

    if (!response.result) {
      throw new RaindropApiError('Failed to create bookmark');
    }

    logger.info('Created Raindrop bookmark', { url: bookmark.link });
  }

  /**
   * Make an authenticated request to the Raindrop API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new AuthError('Raindrop token not configured');
    }

    const url = `${RAINDROP_API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof RaindropApiError) {
        throw error;
      }

      // Network or other errors
      logger.error('Raindrop API request failed', error as Error, { endpoint });

      // Detect network failures
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('network') ||
          !navigator.onLine) {
        throw new NetworkError('Network connection failed. Please check your internet connection.');
      }

      throw new RaindropApiError(
        `Request error: ${errorMessage}`,
        undefined,
        error
      );
    }
  }

  /**
   * Handle API error responses
   */
  private async handleError(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.errorMessage || errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use the status text
    }

    // Rate limit error
    if (response.status === 429) {
      logger.warn('Raindrop API rate limit exceeded');
      throw new RateLimitError(errorMessage);
    }

    // Authentication error
    if (response.status === 401 || response.status === 403) {
      logger.error('Raindrop API authentication error');
      throw new AuthError(errorMessage);
    }

    // Other errors
    throw new RaindropApiError(errorMessage, response.status);
  }
}

// Singleton instance
export const raindropApi = new RaindropApi();
