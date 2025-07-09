import { Event, EventType, EventsService, Tracker as ITracker, InternalEventType } from '../types';
import { deepClone } from '../utils';
import { ContextManager } from './context';

/**
 * Internal tracker implementation that automatically injects context
 */
export class Tracker implements ITracker {
  constructor(
    private eventsService: EventsService,
    private contextManager: ContextManager
  ) {}

  track(
    eventName: string,
    eventType: EventType | InternalEventType,
    properties?: Record<string, unknown>
  ): void {
    const eventContext = this.contextManager.getContext();

    const event: Event = {
      eventName,
      eventType,
      properties: properties ? deepClone(properties) : undefined,
      timestamp: new Date().toISOString(),
      context: eventContext,
    };

    this.eventsService.send(event);
  }
}
