import { describe, it, expect } from 'vitest';
import { MessageType, BookmarkDetectedPayload } from '../src/shared/types/messages';
import { Tweet } from '../src/shared/types/tweet';

describe('Message Types - Custom Tag Support', () => {
  const createMockTweet = (): Tweet => ({
    id: '1234567890',
    url: 'https://x.com/testuser/status/1234567890',
    text: 'This is a test tweet',
    author: {
      handle: '@testuser',
      displayName: 'Test User',
    },
    timestamp: Date.now(),
    isRetweet: false,
    isDeleted: false,
  });

  describe('BookmarkDetectedPayload', () => {
    it('should accept payload without customTag', () => {
      const tweet = createMockTweet();
      const payload: BookmarkDetectedPayload = {
        tweet,
      };

      expect(payload.tweet).toBe(tweet);
      expect(payload.customTag).toBeUndefined();
    });

    it('should accept payload with customTag', () => {
      const tweet = createMockTweet();
      const payload: BookmarkDetectedPayload = {
        tweet,
        customTag: 'research',
      };

      expect(payload.tweet).toBe(tweet);
      expect(payload.customTag).toBe('research');
    });

    it('should accept payload with undefined customTag', () => {
      const tweet = createMockTweet();
      const payload: BookmarkDetectedPayload = {
        tweet,
        customTag: undefined,
      };

      expect(payload.tweet).toBe(tweet);
      expect(payload.customTag).toBeUndefined();
    });

    it('should accept payload with empty string customTag', () => {
      const tweet = createMockTweet();
      const payload: BookmarkDetectedPayload = {
        tweet,
        customTag: '',
      };

      expect(payload.tweet).toBe(tweet);
      expect(payload.customTag).toBe('');
    });

    it('should handle various custom tag formats', () => {
      const tweet = createMockTweet();

      const testCases = [
        'simple',
        'with-hyphen',
        'with_underscore',
        'with123numbers',
        'UPPERCASE',
        'mixedCase',
        'with spaces',
        'special!chars',
      ];

      testCases.forEach(tag => {
        const payload: BookmarkDetectedPayload = {
          tweet,
          customTag: tag,
        };

        expect(payload.customTag).toBe(tag);
      });
    });
  });

  describe('Message Structure', () => {
    it('should create valid BOOKMARK_DETECTED message without customTag', () => {
      const tweet = createMockTweet();
      const message = {
        type: MessageType.BOOKMARK_DETECTED,
        payload: {
          tweet,
        } as BookmarkDetectedPayload,
      };

      expect(message.type).toBe(MessageType.BOOKMARK_DETECTED);
      expect(message.payload.tweet).toBe(tweet);
      expect(message.payload.customTag).toBeUndefined();
    });

    it('should create valid BOOKMARK_DETECTED message with customTag', () => {
      const tweet = createMockTweet();
      const message = {
        type: MessageType.BOOKMARK_DETECTED,
        payload: {
          tweet,
          customTag: 'todo',
        } as BookmarkDetectedPayload,
      };

      expect(message.type).toBe(MessageType.BOOKMARK_DETECTED);
      expect(message.payload.tweet).toBe(tweet);
      expect(message.payload.customTag).toBe('todo');
    });

    it('should serialize and deserialize message with customTag', () => {
      const tweet = createMockTweet();
      const originalMessage = {
        type: MessageType.BOOKMARK_DETECTED,
        payload: {
          tweet,
          customTag: 'important',
        } as BookmarkDetectedPayload,
      };

      // Simulate message passing through JSON serialization
      const serialized = JSON.stringify(originalMessage);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.type).toBe(MessageType.BOOKMARK_DETECTED);
      expect(deserialized.payload.tweet.id).toBe(tweet.id);
      expect(deserialized.payload.customTag).toBe('important');
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle messages from older versions without customTag', () => {
      const tweet = createMockTweet();

      // Old message format without customTag
      const oldMessage = {
        type: MessageType.BOOKMARK_DETECTED,
        payload: {
          tweet,
        },
      };

      const payload = oldMessage.payload as BookmarkDetectedPayload;
      expect(payload.tweet).toBe(tweet);
      expect(payload.customTag).toBeUndefined();
    });

    it('should handle null customTag gracefully', () => {
      const tweet = createMockTweet();
      const payload: BookmarkDetectedPayload = {
        tweet,
        customTag: undefined,
      };

      // Should not throw and should work fine
      expect(() => {
        const message = {
          type: MessageType.BOOKMARK_DETECTED,
          payload,
        };
        JSON.stringify(message);
      }).not.toThrow();
    });
  });
});
