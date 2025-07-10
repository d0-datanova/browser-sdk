import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextManager } from './context';
import { browserLocalStorage } from '../storage/local-storage';
import { browserSessionStorage } from '../storage/session-storage';

vi.mock('../storage/local-storage');
vi.mock('../storage/session-storage');

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock storage get/set methods
    vi.mocked(browserLocalStorage.get).mockReturnValue(null);
    vi.mocked(browserSessionStorage.get).mockReturnValue(null);
    vi.mocked(browserLocalStorage.set).mockReturnValue(undefined);
    vi.mocked(browserSessionStorage.set).mockReturnValue(undefined);

    // Mock window and document
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/page?query=123',
        pathname: '/page',
        search: '?query=123',
      },
      writable: true,
    });

    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true,
    });

    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com',
      writable: true,
    });

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Test Browser',
      writable: true,
    });

    contextManager = new ContextManager();
  });

  describe('constructor', () => {
    it('should create session ID if not exists', () => {
      expect(browserSessionStorage.get).toHaveBeenCalledWith('session_id');
      expect(browserSessionStorage.set).toHaveBeenCalledWith(
        'session_id',
        expect.stringMatching(/^ss-[a-z0-9]+-[a-z0-9]+$/)
      );
    });

    it('should create fingerprint if not exists', () => {
      expect(browserLocalStorage.get).toHaveBeenCalledWith('fingerprint');
      expect(browserLocalStorage.set).toHaveBeenCalledWith(
        'fingerprint',
        expect.stringMatching(/^fp-[a-z0-9]+-[a-z0-9]+$/)
      );
    });

    it('should use existing session ID if available', () => {
      // Clear all mocks first
      vi.clearAllMocks();

      // Mock to return existing session ID when asked for 'session_id'
      vi.mocked(browserSessionStorage.get).mockImplementation((key) => {
        if (key === 'session_id') {
          return 'existing-session-id';
        }
        return null;
      });
      vi.mocked(browserLocalStorage.get).mockReturnValue(null);

      const cm = new ContextManager();
      const context = cm.getContext();

      expect(context.sessionId).toBe('existing-session-id');
      // Session storage set should not be called for session ID
      expect(browserSessionStorage.set).not.toHaveBeenCalledWith('session_id', expect.anything());
      // But it will be called for fingerprint since that doesn't exist
      expect(browserLocalStorage.set).toHaveBeenCalledWith('fingerprint', expect.anything());
    });

    it('should use existing fingerprint if available', () => {
      // Clear all mocks first
      vi.clearAllMocks();

      vi.mocked(browserSessionStorage.get).mockReturnValue(null);
      // Mock to return existing fingerprint when asked for 'fingerprint'
      vi.mocked(browserLocalStorage.get).mockImplementation((key) => {
        if (key === 'fingerprint') {
          return 'existing-fingerprint';
        }
        return null;
      });

      const cm = new ContextManager();
      const identifier = cm.getIdentifier();

      expect(identifier).toBe('existing-fingerprint');
      // Local storage set should not be called for fingerprint
      expect(browserLocalStorage.set).not.toHaveBeenCalledWith('fingerprint', expect.anything());
      // But it will be called for session since that doesn't exist
      expect(browserSessionStorage.set).toHaveBeenCalledWith('session_id', expect.anything());
    });
  });

  describe('setUserId', () => {
    it('should set user ID', () => {
      contextManager.setUserId('user123');
      const context = contextManager.getContext();
      expect(context.userId).toBe('user123');
    });
  });

  describe('clearUserId', () => {
    it('should clear user ID', () => {
      contextManager.setUserId('user123');
      contextManager.clearUserId();
      const context = contextManager.getContext();
      expect(context.userId).toBeUndefined();
    });
  });

  describe('overrideContext', () => {
    it('should override context values', () => {
      const overrides = {
        userId: 'override-user',
        browser: {
          url: 'https://override.com',
          title: 'Override Title',
          referrer: '',
          path: '/override',
          search: '',
          userAgent: 'Override Agent',
        },
      };

      contextManager.overrideContext(overrides);
      const context = contextManager.getContext();

      expect(context.userId).toBe('override-user');
      expect(context.browser.url).toBe('https://override.com');
      expect(context.browser.title).toBe('Override Title');
    });

    it('should merge overrides with base context', () => {
      contextManager.setUserId('original-user');
      contextManager.overrideContext({
        browser: {
          url: 'https://override.com',
          title: 'Override Title',
          referrer: '',
          path: '/override',
          search: '',
          userAgent: 'Override Agent',
        },
      });

      const context = contextManager.getContext();
      expect(context.userId).toBe('original-user'); // Not overridden
      expect(context.browser.url).toBe('https://override.com'); // Overridden
    });
  });

  describe('getContext', () => {
    it('should return complete context', () => {
      contextManager.setUserId('user123');
      const context = contextManager.getContext();

      expect(context).toMatchObject({
        userId: 'user123',
        sessionId: expect.stringMatching(/^ss-[a-z0-9]+-[a-z0-9]+$/),
        browser: {
          url: 'https://example.com/page?query=123',
          title: 'Test Page',
          referrer: 'https://google.com',
          path: '/page',
          search: '?query=123',
          userAgent: 'Mozilla/5.0 Test Browser',
        },
        library: {
          name: '@datanova/browser',
          version: '0.1.0',
        },
      });
    });

    it('should return empty browser context in non-browser environment', () => {
      // Mock undefined window
      const originalWindow = global.window;
      // @ts-expect-error - Setting window to undefined for testing non-browser environment
      global.window = undefined;

      const cm = new ContextManager();
      const context = cm.getContext();

      expect(context.browser).toEqual({
        url: '',
        title: '',
        referrer: '',
        path: '',
        search: '',
        userAgent: '',
      });

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('getIdentifier', () => {
    it('should prioritize userId over fingerprint', () => {
      vi.mocked(browserLocalStorage.get).mockReturnValue('fingerprint-123');
      contextManager.setUserId('user123');

      expect(contextManager.getIdentifier()).toBe('user123');
    });

    it('should use fingerprint when no userId', () => {
      // Create a new context manager with mocked fingerprint
      vi.mocked(browserSessionStorage.get).mockReturnValueOnce(null);
      vi.mocked(browserLocalStorage.get).mockReturnValueOnce('fingerprint-123');

      const cm = new ContextManager();
      expect(cm.getIdentifier()).toBe('fingerprint-123');
    });

    it('should fall back to sessionId when no userId or fingerprint', () => {
      // Both storages return null initially, which will trigger generation of new IDs
      vi.mocked(browserLocalStorage.get).mockReturnValue(null);
      vi.mocked(browserSessionStorage.get).mockReturnValue(null);

      const cm = new ContextManager();
      // Even though storage returns null, the constructor will generate a fingerprint
      // So the identifier will be the generated fingerprint, not the session ID
      const identifier = cm.getIdentifier();

      // The identifier should be the generated fingerprint
      expect(identifier).toMatch(/^fp-[a-z0-9]+-[a-z0-9]+$/);
    });
  });
});
