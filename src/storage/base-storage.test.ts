import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserStorage } from './base-storage';

describe('BrowserStorage', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
  });

  describe('constructor', () => {
    it('should use localStorage when type is localStorage', () => {
      const originalLocalStorage = window.localStorage;
      window.localStorage = mockStorage;

      const storage = new BrowserStorage('localStorage');
      storage.set('test', 'value');

      expect(mockStorage.setItem).toHaveBeenCalled();

      window.localStorage = originalLocalStorage;
    });

    it('should use sessionStorage when type is sessionStorage', () => {
      const originalSessionStorage = window.sessionStorage;
      window.sessionStorage = mockStorage;

      const storage = new BrowserStorage('sessionStorage');
      storage.set('test', 'value');

      expect(mockStorage.setItem).toHaveBeenCalled();

      window.sessionStorage = originalSessionStorage;
    });

    it('should generate prefix based on origin hash', () => {
      const originalLocalStorage = window.localStorage;
      window.localStorage = mockStorage;

      const storage = new BrowserStorage('localStorage');
      storage.set('test', 'value');

      const call = vi.mocked(mockStorage.setItem).mock.calls[0];
      expect(call[0]).toMatch(/^datanova\.sdk\.[a-z0-9]{6}\.test$/);

      window.localStorage = originalLocalStorage;
    });

    it('should use custom prefix if provided', () => {
      const originalLocalStorage = window.localStorage;
      window.localStorage = mockStorage;

      const storage = new BrowserStorage('localStorage', 'custom.');
      storage.set('test', 'value');

      expect(mockStorage.setItem).toHaveBeenCalledWith('custom.test', '"value"');

      window.localStorage = originalLocalStorage;
    });

    it('should handle non-browser environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Deleting window for testing non-browser environment
      delete global.window;

      const storage = new BrowserStorage('localStorage');

      // Should not throw
      expect(() => {
        storage.set('test', 'value');
        storage.get('test');
        storage.remove('test');
      }).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('get', () => {
    let storage: BrowserStorage;
    let originalLocalStorage: Storage;

    beforeEach(() => {
      originalLocalStorage = window.localStorage;
      window.localStorage = mockStorage;
      storage = new BrowserStorage('localStorage', 'test.');
    });

    afterEach(() => {
      window.localStorage = originalLocalStorage;
    });

    it('should retrieve and parse stored values', () => {
      vi.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify({ key: 'value' }));

      const result = storage.get<{ key: string }>('test');

      expect(mockStorage.getItem).toHaveBeenCalledWith('test.test');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for non-existent keys', () => {
      vi.mocked(mockStorage.getItem).mockReturnValue(null);

      const result = storage.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      vi.mocked(mockStorage.getItem).mockReturnValue('invalid json');

      const result = storage.get('test');

      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      const testCases = [
        { value: 'string', stored: '"string"' },
        { value: 123, stored: '123' },
        { value: true, stored: 'true' },
        { value: [1, 2, 3], stored: '[1,2,3]' },
        { value: { nested: { value: 'test' } }, stored: '{"nested":{"value":"test"}}' },
      ];

      testCases.forEach(({ value, stored }) => {
        vi.mocked(mockStorage.getItem).mockReturnValue(stored);
        const result = storage.get('test');
        expect(result).toEqual(value);
      });
    });
  });

  describe('set', () => {
    let storage: BrowserStorage;
    let originalLocalStorage: Storage;

    beforeEach(() => {
      originalLocalStorage = window.localStorage;
      window.localStorage = mockStorage;
      storage = new BrowserStorage('localStorage', 'test.');
    });

    afterEach(() => {
      window.localStorage = originalLocalStorage;
    });

    it('should stringify and store values', () => {
      storage.set('key', { data: 'value' });

      expect(mockStorage.setItem).toHaveBeenCalledWith('test.key', '{"data":"value"}');
    });

    it('should handle different data types', () => {
      const testCases = [
        { key: 'string', value: 'test' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: false },
        { key: 'array', value: [1, 2, 3] },
        { key: 'object', value: { nested: true } },
        { key: 'null', value: null },
      ];

      testCases.forEach(({ key, value }) => {
        storage.set(key, value);
        expect(mockStorage.setItem).toHaveBeenCalledWith(`test.${key}`, JSON.stringify(value));
      });
    });

    it('should handle storage errors silently', () => {
      vi.mocked(mockStorage.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => {
        storage.set('test', 'value');
      }).not.toThrow();
    });
  });

  describe('remove', () => {
    let storage: BrowserStorage;
    let originalLocalStorage: Storage;

    beforeEach(() => {
      originalLocalStorage = window.localStorage;
      window.localStorage = mockStorage;
      storage = new BrowserStorage('localStorage', 'test.');
    });

    afterEach(() => {
      window.localStorage = originalLocalStorage;
    });

    it('should remove items with prefixed key', () => {
      storage.remove('key');

      expect(mockStorage.removeItem).toHaveBeenCalledWith('test.key');
    });

    it('should handle removal errors silently', () => {
      vi.mocked(mockStorage.removeItem).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => {
        storage.remove('test');
      }).not.toThrow();
    });
  });

  describe('prefix generation', () => {
    it('should generate consistent prefix for same origin', () => {
      const originalLocalStorage = window.localStorage;
      window.localStorage = mockStorage;

      const storage1 = new BrowserStorage('localStorage');
      const storage2 = new BrowserStorage('localStorage');

      storage1.set('test', 'value1');
      storage2.set('test', 'value2');

      const key1 = vi.mocked(mockStorage.setItem).mock.calls[0][0];
      const key2 = vi.mocked(mockStorage.setItem).mock.calls[1][0];

      expect(key1).toBe(key2);

      window.localStorage = originalLocalStorage;
    });

    it('should generate different prefixes for different origins', () => {
      const originalLocalStorage = window.localStorage;
      const originalLocation = window.location;
      window.localStorage = mockStorage;

      // Mock different origins
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com' },
        writable: true,
      });

      const storage1 = new BrowserStorage('localStorage');
      storage1.set('test', 'value');
      const key1 = vi.mocked(mockStorage.setItem).mock.calls[0][0];

      Object.defineProperty(window, 'location', {
        value: { origin: 'https://different.com' },
        writable: true,
      });

      const storage2 = new BrowserStorage('localStorage');
      storage2.set('test', 'value');
      const key2 = vi.mocked(mockStorage.setItem).mock.calls[1][0];

      expect(key1).not.toBe(key2);

      window.localStorage = originalLocalStorage;
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });
  });
});
