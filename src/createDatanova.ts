import { Datanova } from './datanova';
import { DatanovaEventsService } from './services/events/datanova';
import { DatanovaExperimentsService } from './services/experiments/datanova';
import { EventsService, ExperimentsService } from './types';

export function createDatanova(sdkKey: string): Datanova;
export function createDatanova(config: {
  eventsService?: EventsService;
  experimentsService?: ExperimentsService;
}): Datanova;

/**
 * Create and initialize a Datanova instance
 * @param keyOrServices - Either an SDK key string or configuration object
 * @returns Initialized Datanova instance
 * @example
 * ```javascript
 * import { createDatanova } from '@datanova/browser';
 *
 * // Simple usage with API key
 * const datanova = createDatanova("YOUR_SDK_KEY");
 *
 * // Advanced usage with custom services
 * const datanova = createDatanova({
 *   eventsService: new ConsoleEventsService(),
 *   experimentsService: new DatanovaExperimentsService("YOUR_SDK_KEY")
 * });
 * ```
 */
export function createDatanova(
  keyOrServices:
    | string
    | {
        eventsService?: EventsService;
        experimentsService?: ExperimentsService;
      }
): Datanova {
  const datanova = new Datanova();

  if (typeof keyOrServices === 'string') {
    datanova.init({
      eventsService: new DatanovaEventsService(keyOrServices),
      experimentsService: new DatanovaExperimentsService(keyOrServices),
    });
  } else {
    datanova.init({
      eventsService: keyOrServices.eventsService,
      experimentsService: keyOrServices.experimentsService,
    });
  }

  return datanova;
}
