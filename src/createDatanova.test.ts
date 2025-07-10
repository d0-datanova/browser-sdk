import { describe, it, expect, vi } from 'vitest';
import { createDatanova } from './createDatanova';
import { Datanova } from './datanova';
import { DatanovaEventsService } from './services/events/datanova';
import { DatanovaExperimentsService } from './services/experiments/datanova';
import { EventsService, ExperimentsService, EventType } from './types';

vi.mock('./services/events/datanova');
vi.mock('./services/experiments/datanova');

describe('createDatanova', () => {
  it('should create and initialize Datanova instance with SDK key', () => {
    const sdkKey = 'dn_sdk_test123';
    const datanova = createDatanova(sdkKey);

    expect(datanova).toBeInstanceOf(Datanova);
    expect(DatanovaEventsService).toHaveBeenCalledWith(sdkKey);
    expect(DatanovaExperimentsService).toHaveBeenCalledWith(sdkKey);
  });

  it('should create and initialize Datanova instance with custom services', () => {
    const mockEventsService: EventsService = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    const mockExperimentsService: ExperimentsService = {
      getVariant: vi.fn().mockResolvedValue('control'),
    };

    const datanova = createDatanova({
      eventsService: mockEventsService,
      experimentsService: mockExperimentsService,
    });

    expect(datanova).toBeInstanceOf(Datanova);

    // Test that the services are properly initialized
    datanova.track('test', EventType.CLICK);
    expect(mockEventsService.send).toHaveBeenCalled();
  });

  it('should work with only events service', async () => {
    const mockEventsService: EventsService = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    const datanova = createDatanova({
      eventsService: mockEventsService,
    });

    expect(datanova).toBeInstanceOf(Datanova);

    // Should be able to track events
    expect(() => {
      datanova.track('test', EventType.CLICK);
    }).not.toThrow();

    // Should throw when trying to use experiments
    await expect(async () => {
      await datanova.getVariant(123);
    }).rejects.toThrow('No experiments service configured');
  });

  it('should work with only experiments service', async () => {
    const mockExperimentsService: ExperimentsService = {
      getVariant: vi.fn().mockResolvedValue('control'),
    };

    const datanova = createDatanova({
      experimentsService: mockExperimentsService,
    });

    expect(datanova).toBeInstanceOf(Datanova);

    // Should be able to get variants
    await expect(datanova.getVariant(123)).resolves.toBeDefined();

    // Should throw when trying to track events
    expect(() => {
      datanova.track('test', EventType.CLICK);
    }).toThrow('No events service configured');
  });

  it('should handle empty configuration object', () => {
    // This should throw because no services are provided
    expect(() => {
      createDatanova({});
    }).toThrow("At least one of 'eventsService' or 'experimentsService' must be provided");
  });

  it('should return different instances for multiple calls', () => {
    const instance1 = createDatanova('key1');
    const instance2 = createDatanova('key2');

    expect(instance1).not.toBe(instance2);
    expect(instance1).toBeInstanceOf(Datanova);
    expect(instance2).toBeInstanceOf(Datanova);
  });

  it('should properly initialize services with SDK key', () => {
    const sdkKey = 'dn_sdk_test123';
    createDatanova(sdkKey);

    // Check that services were created with the correct SDK key
    expect(vi.mocked(DatanovaEventsService)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(DatanovaEventsService)).toHaveBeenCalledWith(sdkKey);

    expect(vi.mocked(DatanovaExperimentsService)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(DatanovaExperimentsService)).toHaveBeenCalledWith(sdkKey);
  });
});
