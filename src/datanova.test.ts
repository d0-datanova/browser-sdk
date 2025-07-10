import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Datanova } from './datanova';
import { EventType, EventsService, ExperimentsService } from './types';

describe('Datanova Client', () => {
  let client: Datanova;
  let mockEventsService: EventsService;
  let mockExperimentsService: ExperimentsService;

  beforeEach(() => {
    client = new Datanova();
    mockEventsService = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    mockExperimentsService = {
      getVariant: vi.fn().mockResolvedValue('control'),
    };
  });

  describe('init', () => {
    it('should initialize successfully with events service only', () => {
      expect(() => {
        client.init({ eventsService: mockEventsService });
      }).not.toThrow();
    });

    it('should initialize successfully with experiments service only', () => {
      expect(() => {
        client.init({ experimentsService: mockExperimentsService });
      }).not.toThrow();
    });

    it('should initialize successfully with both services', () => {
      expect(() => {
        client.init({
          eventsService: mockEventsService,
          experimentsService: mockExperimentsService,
        });
      }).not.toThrow();
    });

    it('should throw error when no services are provided', () => {
      expect(() => {
        client.init({});
      }).toThrow("At least one of 'eventsService' or 'experimentsService' must be provided");
    });

    it('should accept context overrides', () => {
      expect(() => {
        client.init({
          eventsService: mockEventsService,
          context: {
            library: {
              name: 'test',
              version: '1.0.0',
            },
          },
        });
      }).not.toThrow();
    });
  });

  describe('identify', () => {
    it('should throw error if not initialized', () => {
      expect(() => {
        client.identify('user123');
      }).toThrow('Client not initialized');
    });

    it('should identify user successfully when initialized', () => {
      client.init({ eventsService: mockEventsService });
      expect(() => {
        client.identify('user123');
      }).not.toThrow();
    });

    it('should identify user with properties', () => {
      client.init({ eventsService: mockEventsService });
      expect(() => {
        client.identify('user123', {
          plan: 'premium',
          role: 'admin',
          company: 'Acme Corp',
        });
      }).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should throw error if not initialized', () => {
      expect(() => {
        client.reset();
      }).toThrow('Client not initialized');
    });

    it('should reset successfully when initialized', () => {
      client.init({ eventsService: mockEventsService });
      client.identify('user123');
      expect(() => {
        client.reset();
      }).not.toThrow();
    });

    it('should clear user properties on reset', () => {
      client.init({ eventsService: mockEventsService });
      client.identify('user123', { plan: 'premium' });
      client.reset();
      client.track('test_event', EventType.CLICK);

      expect(mockEventsService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            userId: undefined,
            userProperties: undefined,
          }),
        })
      );
    });
  });

  describe('tracking methods', () => {
    beforeEach(() => {
      client.init({ eventsService: mockEventsService });
    });

    describe('track', () => {
      it('should include user properties in tracked events', () => {
        const userProperties = { plan: 'premium', role: 'admin' };
        client.identify('user123', userProperties);
        client.track('feature_used', EventType.CLICK);

        expect(mockEventsService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            eventName: 'feature_used',
            eventType: EventType.CLICK,
            context: expect.objectContaining({
              userId: 'user123',
              userProperties: userProperties,
            }),
          })
        );
      });
      it('should track event with properties', () => {
        client.track('button_clicked', EventType.CLICK, { buttonId: 'submit' });
        expect(mockEventsService.send).toHaveBeenCalledTimes(1);
        expect(mockEventsService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            eventName: 'button_clicked',
            eventType: EventType.CLICK,
            properties: { buttonId: 'submit' },
          })
        );
      });

      it('should track event without properties', () => {
        client.track('page_loaded', EventType.PAGE_VIEW);
        expect(mockEventsService.send).toHaveBeenCalledTimes(1);
      });

      it('should throw error if no events service configured', () => {
        const clientNoEvents = new Datanova();
        clientNoEvents.init({ experimentsService: mockExperimentsService });

        expect(() => {
          clientNoEvents.track('test', EventType.CLICK);
        }).toThrow('No events service configured');
      });
    });

    describe('trackClick', () => {
      it('should track click event', () => {
        client.trackClick('button_clicked', { buttonId: 'submit' });
        expect(mockEventsService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            eventName: 'button_clicked',
            eventType: EventType.CLICK,
            properties: { buttonId: 'submit' },
          })
        );
      });
    });

    describe('trackPageView', () => {
      it('should track page view event', () => {
        client.trackPageView('home_page_viewed', { test: true });
        expect(mockEventsService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            eventName: 'home_page_viewed',
            eventType: EventType.PAGE_VIEW,
            properties: { test: true },
          })
        );
      });
    });

    describe('trackImpression', () => {
      it('should track impression event', () => {
        client.trackImpression('banner_shown', { bannerId: 'promo-123' });
        expect(mockEventsService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            eventName: 'banner_shown',
            eventType: EventType.IMPRESSION,
            properties: { bannerId: 'promo-123' },
          })
        );
      });
    });

    describe('trackSubmit', () => {
      it('should track submit event', () => {
        client.trackSubmit('form_submitted', { formId: 'contact' });
        expect(mockEventsService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            eventName: 'form_submitted',
            eventType: EventType.SUBMIT,
            properties: { formId: 'contact' },
          })
        );
      });
    });

    describe('trackChange', () => {
      it('should track change event', () => {
        client.trackChange('setting_changed', { setting: 'theme', value: 'dark' });
        expect(mockEventsService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            eventName: 'setting_changed',
            eventType: EventType.CHANGE,
            properties: { setting: 'theme', value: 'dark' },
          })
        );
      });
    });
  });

  describe('getVariant', () => {
    it('should throw error if not initialized', async () => {
      await expect(client.getVariant(123)).rejects.toThrow('Client not initialized');
    });

    it('should throw error if no experiments service configured', async () => {
      client.init({ eventsService: mockEventsService });
      await expect(client.getVariant(123)).rejects.toThrow('No experiments service configured');
    });

    it('should return variant when experiments service is configured', async () => {
      client.init({ experimentsService: mockExperimentsService });
      const variant = await client.getVariant(123);
      expect(variant).toBe('control');
      expect(mockExperimentsService.getVariant).toHaveBeenCalledWith(123, expect.any(String));
    });

    it('should use user ID as identifier if set', async () => {
      client.init({ experimentsService: mockExperimentsService });
      client.identify('user123');
      await client.getVariant(456);
      expect(mockExperimentsService.getVariant).toHaveBeenCalledWith(456, expect.any(String));
    });
  });
});
