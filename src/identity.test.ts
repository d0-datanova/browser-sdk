import { describe, it, expect } from 'vitest';
import { generateAnonymousId, generateFingerprint } from './identity';

describe('identity utilities', () => {
  describe('generateAnonymousId', () => {
    it('should generate anonymous ID with correct format', () => {
      const id = generateAnonymousId();
      expect(id).toMatch(/^anon-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(generateAnonymousId());
      }

      expect(ids.size).toBe(100);
    });

    it('should have correct prefix', () => {
      const id = generateAnonymousId();
      expect(id.startsWith('anon-')).toBe(true);
    });

    it('should contain timestamp and random parts', () => {
      const id = generateAnonymousId();
      const parts = id.split('-');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('anon');
      expect(parts[1]).toMatch(/^[a-z0-9]+$/); // timestamp in base36
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // random in base36
    });

    it('should generate IDs with increasing timestamps', () => {
      const id1 = generateAnonymousId();
      const id2 = generateAnonymousId();

      const timestamp1 = parseInt(id1.split('-')[1], 36);
      const timestamp2 = parseInt(id2.split('-')[1], 36);

      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
    });
  });

  describe('generateFingerprint', () => {
    it('should generate fingerprint with correct format', () => {
      const fp = generateFingerprint();
      expect(fp).toMatch(/^fp-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate unique fingerprints', () => {
      const fps = new Set<string>();

      for (let i = 0; i < 100; i++) {
        fps.add(generateFingerprint());
      }

      expect(fps.size).toBe(100);
    });

    it('should have correct prefix', () => {
      const fp = generateFingerprint();
      expect(fp.startsWith('fp-')).toBe(true);
    });

    it('should contain timestamp and random parts', () => {
      const fp = generateFingerprint();
      const parts = fp.split('-');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('fp');
      expect(parts[1]).toMatch(/^[a-z0-9]+$/); // timestamp in base36
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // random in base36
    });
  });

  describe('ID generation consistency', () => {
    it('should not generate identical IDs between different functions', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 50; i++) {
        ids.add(generateAnonymousId());
        ids.add(generateFingerprint());
      }

      // Should have 100 unique IDs (50 anonymous + 50 fingerprints)
      expect(ids.size).toBe(100);
    });
  });
});
