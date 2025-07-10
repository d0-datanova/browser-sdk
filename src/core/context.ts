import { browserLocalStorage } from '../storage/local-storage';
import { browserSessionStorage } from '../storage/session-storage';
import { BrowserContext, Context } from '../types';

export class ContextManager {
  private userId?: string;
  private userProperties?: Record<string, unknown>;
  private sessionId: string;
  private fingerprint: string;
  private contextOverrides?: Partial<Context>;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.fingerprint = this.getOrCreateFingerprint();
  }

  setUser(userId: string, properties?: Record<string, unknown>): void {
    this.userId = userId;
    this.userProperties = properties;
  }

  clearUser(): void {
    this.userId = undefined;
    this.userProperties = undefined;
  }

  overrideContext(contextOverrides: Partial<Context>): void {
    this.contextOverrides = contextOverrides;
  }

  getContext(): Context {
    const baseContext: Context = {
      userId: this.userId,
      userProperties: this.userProperties,
      sessionId: this.sessionId,
      browser: this.getBrowserContext(),
      library: {
        name: '@datanova/browser',
        version: '0.1.0',
      },
    };

    return {
      ...baseContext,
      ...this.contextOverrides,
    };
  }

  getIdentifier(): string {
    return this.userId || this.fingerprint || this.sessionId;
  }

  private getBrowserContext(): BrowserContext {
    if (typeof window === 'undefined') {
      return {
        url: '',
        title: '',
        referrer: '',
        path: '',
        search: '',
        userAgent: '',
      };
    }

    return {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      path: window.location.pathname,
      search: window.location.search,
      userAgent: navigator.userAgent,
    };
  }

  private getOrCreateSessionId(): string {
    const key = 'session_id';
    let sessionId = browserSessionStorage.get<string>(key);

    if (!sessionId) {
      sessionId = this.generateId('ss');
      browserSessionStorage.set(key, sessionId);
    }

    return sessionId;
  }

  private getOrCreateFingerprint(): string {
    const key = 'fingerprint';
    let fingerprint = browserLocalStorage.get<string>(key);

    if (!fingerprint) {
      fingerprint = this.generateId('fp');
      browserLocalStorage.set(key, fingerprint);
    }

    return fingerprint;
  }

  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}-${timestamp}-${random}`;
  }
}
