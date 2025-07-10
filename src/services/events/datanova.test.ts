import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatanovaEventsService } from './datanova';
import { Event, EventType } from '../../types';

// Mock the API base URL global
declare global {
  var __API_BASE_URL__: string;
}
(global as { __API_BASE_URL__: string }).__API_BASE_URL__ = 'https://api.datanova.com';

describe('DatanovaEventsService', () => {
  let service: DatanovaEventsService;
  const validSdkKey = 'dn_sdk_test123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('constructor', () => {
    it('should create instance with valid SDK key', () => {
      expect(() => {
        service = new DatanovaEventsService(validSdkKey);
      }).not.toThrow();
    });

    it('should throw error for invalid SDK key', () => {
      expect(() => {
        new DatanovaEventsService('invalid_key');
      }).toThrow("Invalid API key. Must start with 'dn_sdk_'");
    });

    it('should throw error for empty SDK key', () => {
      expect(() => {
        new DatanovaEventsService('');
      }).toThrow("Invalid API key. Must start with 'dn_sdk_'");
    });

    it('should use custom endpoint if provided', () => {
      const customEndpoint = 'https://custom.datanova.com/events';
      service = new DatanovaEventsService(validSdkKey, customEndpoint);

      const event: Event = {
        eventName: 'test',
        eventType: EventType.CLICK,
        timestamp: new Date().toISOString(),
        context: {
          sessionId: 'session123',
          browser: {
            url: '',
            title: '',
            referrer: '',
            path: '',
            search: '',
            userAgent: '',
          },
          library: {
            name: '@datanova/browser',
            version: '0.1.0',
          },
        },
      };

      service.send(event);

      expect(fetch).toHaveBeenCalledWith(customEndpoint, expect.any(Object));
    });
  });

  describe('send', () => {
    beforeEach(() => {
      service = new DatanovaEventsService(validSdkKey);
    });

    it('should send event with correct parameters', async () => {
      const event: Event = {
        eventName: 'test_event',
        eventType: EventType.CLICK,
        properties: { buttonId: 'submit' },
        timestamp: '2023-01-01T00:00:00.000Z',
        context: {
          userId: 'user123',
          sessionId: 'session456',
          browser: {
            url: 'https://example.com',
            title: 'Test Page',
            referrer: '',
            path: '/',
            search: '',
            userAgent: 'Test Browser',
          },
          library: {
            name: '@datanova/browser',
            version: '0.1.0',
          },
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      await service.send(event);

      expect(fetch).toHaveBeenCalledWith('https://api.datanova.com/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validSdkKey}`,
        },
        body: JSON.stringify(event),
      });
    });

    it('should handle successful response', async () => {
      const event: Event = {
        eventName: 'test',
        eventType: EventType.PAGE_VIEW,
        timestamp: new Date().toISOString(),
        context: {
          sessionId: 'session123',
          browser: {
            url: '',
            title: '',
            referrer: '',
            path: '',
            search: '',
            userAgent: '',
          },
          library: {
            name: '@datanova/browser',
            version: '0.1.0',
          },
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      await expect(service.send(event)).resolves.not.toThrow();
    });

    it('should handle HTTP errors silently', async () => {
      const event: Event = {
        eventName: 'test',
        eventType: EventType.CLICK,
        timestamp: new Date().toISOString(),
        context: {
          sessionId: 'session123',
          browser: {
            url: '',
            title: '',
            referrer: '',
            path: '',
            search: '',
            userAgent: '',
          },
          library: {
            name: '@datanova/browser',
            version: '0.1.0',
          },
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.send(event)).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Datanova] Failed to send event:',
        expect.any(Error)
      );
    });

    it('should handle network errors silently', async () => {
      const event: Event = {
        eventName: 'test',
        eventType: EventType.CLICK,
        timestamp: new Date().toISOString(),
        context: {
          sessionId: 'session123',
          browser: {
            url: '',
            title: '',
            referrer: '',
            path: '',
            search: '',
            userAgent: '',
          },
          library: {
            name: '@datanova/browser',
            version: '0.1.0',
          },
        },
      };

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.send(event)).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Datanova] Failed to send event:',
        expect.any(Error)
      );
    });

    it('should include all event properties in request', async () => {
      const complexEvent: Event = {
        eventName: 'complex_event',
        eventType: EventType.SUBMIT,
        properties: {
          string: 'value',
          number: 123,
          boolean: true,
          nested: {
            deep: {
              value: 'test',
            },
          },
          array: [1, 2, 3],
        },
        timestamp: '2023-01-01T12:00:00.000Z',
        context: {
          userId: 'user789',
          sessionId: 'session789',
          browser: {
            url: 'https://example.com/form',
            title: 'Form Page',
            referrer: 'https://google.com',
            path: '/form',
            search: '?ref=test',
            userAgent: 'Mozilla/5.0',
          },
          library: {
            name: '@datanova/browser',
            version: '0.1.0',
          },
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      await service.send(complexEvent);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body).toEqual(complexEvent);
    });
  });
});
