import { ExperimentsService, Variant } from '../../types';

/**
 * Random experiments service that assigns variants based on a hash
 * Useful for client-side experimentation without server calls
 */
export class RandomExperimentsService implements ExperimentsService {
  private cache = new Map<string, Variant>();
  private splitRatio: number;

  constructor(splitRatio = 0.5) {
    this.splitRatio = splitRatio;
  }

  async getVariant(experimentId: number, identifier: string): Promise<Variant> {
    const cacheKey = `${experimentId}:${identifier}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const hash = this.hashCode(`${experimentId}:${identifier}`);
    const variant = (hash % 100) / 100 < this.splitRatio ? 'variant' : 'control';

    this.cache.set(cacheKey, variant);
    return variant;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
