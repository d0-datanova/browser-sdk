import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Tracker } from './tracker';
import { ContextManager } from './context';
import { EventsService, EventType } from '../types';

describe('Tracker', () => {
  let tracker: Tracker;
  let mockEventsService: EventsService;
  let contextManager: ContextManager;

  beforeEach(() => {
    mockEventsService = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    contextManager = new ContextManager();
    tracker = new Tracker(mockEventsService, contextManager);
  });

  describe('track', () => {
    it('should send event with correct structure', () => {
      const eventName = 'test_event';
      const eventType = EventType.CLICK;
      const properties = { buttonId: 'submit' };

      tracker.track(eventName, eventType, properties);

      expect(mockEventsService.send).toHaveBeenCalledTimes(1);
      expect(mockEventsService.send).toHaveBeenCalledWith({
        eventName,
        eventType,
        properties,
        timestamp: expect.any(String),
        context: expect.objectContaining({
          sessionId: expect.any(String),
          browser: expect.any(Object),
          library: {
            name: '@datanova/browser',
            version: '0.1.0',
          },
        }),
      });
    });

    it('should send event without properties', () => {
      tracker.track('page_view', EventType.PAGE_VIEW);

      expect(mockEventsService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'page_view',
          eventType: EventType.PAGE_VIEW,
          properties: undefined,
          timestamp: expect.any(String),
        })
      );
    });

    it('should include user ID in context if set', () => {
      contextManager.setUser('user123');

      tracker.track('test_event', EventType.CLICK);

      expect(mockEventsService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            userId: 'user123',
          }),
        })
      );
    });

    it('should include user ID and properties in context if set', () => {
      const userProperties = {
        plan: 'premium',
        role: 'admin',
        company: 'Acme Corp',
      };
      contextManager.setUser('user123', userProperties);

      tracker.track('test_event', EventType.CLICK);

      expect(mockEventsService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            userId: 'user123',
            userProperties: userProperties,
          }),
        })
      );
    });

    it('should generate ISO timestamp', () => {
      const beforeTime = new Date().toISOString();
      tracker.track('test_event', EventType.CLICK);
      const afterTime = new Date().toISOString();

      const sentEvent = vi.mocked(mockEventsService.send).mock.calls[0][0];
      const timestamp = new Date(sentEvent.timestamp);

      expect(timestamp.toISOString()).toBe(sentEvent.timestamp);
      expect(sentEvent.timestamp >= beforeTime).toBe(true);
      expect(sentEvent.timestamp <= afterTime).toBe(true);
    });

    it('should handle different event types', () => {
      const eventTypes = [
        EventType.CLICK,
        EventType.PAGE_VIEW,
        EventType.IMPRESSION,
        EventType.SUBMIT,
        EventType.CHANGE,
      ];

      eventTypes.forEach((eventType, index) => {
        tracker.track(`event_${index}`, eventType);
      });

      expect(mockEventsService.send).toHaveBeenCalledTimes(eventTypes.length);

      eventTypes.forEach((eventType, index) => {
        expect(mockEventsService.send).toHaveBeenNthCalledWith(
          index + 1,
          expect.objectContaining({
            eventName: `event_${index}`,
            eventType,
          })
        );
      });
    });

    it('should handle complex properties', () => {
      const complexProperties = {
        string: 'value',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          key: 'value',
          deep: {
            level: 2,
          },
        },
      };

      tracker.track('complex_event', EventType.CLICK, complexProperties);

      expect(mockEventsService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: complexProperties,
        })
      );
    });

    it('should not mutate passed properties', () => {
      const properties = { key: 'value' };
      const originalProperties = { ...properties };

      tracker.track('test_event', EventType.CLICK, properties);

      expect(properties).toEqual(originalProperties);
    });

    it('should handle send errors gracefully', async () => {
      vi.mocked(mockEventsService.send).mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      expect(() => {
        tracker.track('test_event', EventType.CLICK);
      }).not.toThrow();

      // Should have attempted to send
      expect(mockEventsService.send).toHaveBeenCalled();
    });
  });
});
