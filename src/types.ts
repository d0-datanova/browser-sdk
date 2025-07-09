export interface Event {
  eventName: string;
  eventType: EventType;
  properties?: Record<string, unknown>;
  timestamp: string;
  context: Context;
}

export const EventType = {
  CLICK: 'click',
  PAGE_VIEW: 'pageView',
  IMPRESSION: 'impression',
  SUBMIT: 'submit',
  CHANGE: 'change',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export const InternalEventType = {
  SYSTEM: 'system',
} as const;

export type InternalEventType = (typeof InternalEventType)[keyof typeof InternalEventType];

export interface Context {
  userId?: string;
  sessionId: string;
  browser: BrowserContext;
  library: {
    name: string;
    version: string;
  };
}

export interface BrowserContext {
  url: string;
  title: string;
  referrer: string;
  path: string;
  search: string;
  userAgent: string;
}

export interface EventsService {
  send(event: Event): Promise<void>;
}

export interface Tracker {
  track(eventName: string, eventType: EventType, properties?: Record<string, unknown>): void;
}

export interface ExperimentConfig {
  id: number;
  trafficAllocation: number;
  variantAllocation: number;
}

export type Variant = 'control' | 'variant';

export interface ExperimentAssignment {
  experimentId: number;
  variant: Variant;
  assignedAt: number;
  expiresAt?: number;
}

export interface ExperimentsService {
  getVariant(experimentId: number, identifier: string): Promise<Variant>;
}

export interface SDKConfig {
  eventsService?: EventsService;
  experimentsService?: ExperimentsService;
  /** @internal - Context overrides */
  context?: Partial<Context>;
}
