import { ContextManager } from './core/context';
import { ExperimentManager } from './core/experiment-manager';
import { Tracker as ContextAwareTracker } from './core/tracker';
import { EventType, SDKConfig, Variant } from './types';

export class Datanova {
  private initialized = false;
  private tracker?: ContextAwareTracker;
  private readonly contextManager = new ContextManager();
  private experimentManager?: ExperimentManager;

  init(config: SDKConfig): void {
    if (this.initialized) {
      return;
    }

    if (!config.eventsService && !config.experimentsService) {
      throw new Error(
        "At least one of 'eventsService' or 'experimentsService' must be provided to initialize the SDK"
      );
    }

    if (config.context) {
      this.contextManager.overrideContext(config.context);
    }

    if (config.eventsService) {
      this.tracker = new ContextAwareTracker(config.eventsService, this.contextManager);
    }

    if (config.experimentsService) {
      this.experimentManager = new ExperimentManager(config.experimentsService, this.tracker);
    }

    this.initialized = true;
  }

  identify = (userId: string): void => {
    this.assertInitialized();
    this.contextManager.setUserId(userId);
  };

  reset = (): void => {
    this.assertInitialized();
    this.contextManager.clearUserId();
  };

  track = (eventName: string, eventType: EventType, properties?: Record<string, unknown>): void => {
    this.assertInitialized();
    this.assertTracker();
    this.tracker!.track(eventName, eventType, properties);
  };

  trackClick = (eventName: string, properties?: Record<string, unknown>): void => {
    this.assertInitialized();
    this.assertTracker();
    this.tracker!.track(eventName, EventType.CLICK, properties);
  };

  trackPageView = (eventName: string, properties?: Record<string, unknown>): void => {
    this.assertInitialized();
    this.assertTracker();
    this.tracker!.track(eventName, EventType.PAGE_VIEW, properties);
  };

  trackImpression = (eventName: string, properties?: Record<string, unknown>): void => {
    this.assertInitialized();
    this.assertTracker();
    this.tracker!.track(eventName, EventType.IMPRESSION, properties);
  };

  trackSubmit = (eventName: string, properties?: Record<string, unknown>): void => {
    this.assertInitialized();
    this.assertTracker();
    this.tracker!.track(eventName, EventType.SUBMIT, properties);
  };

  trackChange = (eventName: string, properties?: Record<string, unknown>): void => {
    this.assertInitialized();
    this.assertTracker();
    this.tracker!.track(eventName, EventType.CHANGE, properties);
  };

  getVariant = async (experimentId: number): Promise<Variant> => {
    this.assertInitialized();
    this.assertExperimentManager();

    const identifier = this.contextManager.getIdentifier();
    return this.experimentManager!.getVariant(experimentId, identifier);
  };

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new Error('Client not initialized. Call init() first.');
    }
  }

  private assertTracker(): void {
    if (!this.tracker) {
      throw new Error(
        'No events service configured. Initialize the client with an events service to use tracking methods.'
      );
    }
  }

  private assertExperimentManager(): void {
    if (!this.experimentManager) {
      throw new Error(
        'No experiments service configured. Initialize the client with an experiments service to use experiment methods.'
      );
    }
  }
}
