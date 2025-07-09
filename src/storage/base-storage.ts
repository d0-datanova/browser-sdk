type StorageType = 'localStorage' | 'sessionStorage';

export class BrowserStorage {
  private prefix: string;
  private storage: Storage | null;

  constructor(type: StorageType, customPrefix?: string) {
    if (typeof window !== 'undefined') {
      this.storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
    } else {
      this.storage = null;
    }

    if (customPrefix) {
      this.prefix = customPrefix;
    } else {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'default';
      const originHash = this.hashString(origin).toString(36).slice(-6);
      this.prefix = `datanova.${originHash}.`;
    }
  }

  get<T>(key: string): T | null {
    if (!this.storage) {
      return null;
    }

    try {
      const item = this.storage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }

  remove(key: string): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.removeItem(this.prefix + key);
    } catch {
      // Ignore storage errors
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
