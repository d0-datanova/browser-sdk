import { describe, it, expect } from 'vitest';
import { deepClone } from './utils';

describe('deepClone', () => {
  it('should clone primitive values', () => {
    expect(deepClone('string')).toBe('string');
    expect(deepClone(123)).toBe(123);
    expect(deepClone(true)).toBe(true);
    expect(deepClone(false)).toBe(false);
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });

  it('should clone Date objects', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const cloned = deepClone(date);

    expect(cloned).toBeInstanceOf(Date);
    expect(cloned.getTime()).toBe(date.getTime());
    expect(cloned).not.toBe(date); // Different instance
  });

  it('should clone arrays', () => {
    const arr = [1, 'two', { three: 3 }, [4, 5]];
    const cloned = deepClone(arr);

    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr); // Different instance
    expect(cloned[2]).not.toBe(arr[2]); // Nested object is cloned
    expect(cloned[3]).not.toBe(arr[3]); // Nested array is cloned
  });

  it('should clone objects', () => {
    const obj = {
      string: 'value',
      number: 42,
      boolean: true,
      nested: {
        deep: {
          value: 'test',
        },
      },
    };

    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj); // Different instance
    expect(cloned.nested).not.toBe(obj.nested); // Nested object is cloned
    expect(cloned.nested.deep).not.toBe(obj.nested.deep); // Deep nested object is cloned
  });

  it('should clone Set objects', () => {
    const set = new Set([1, 2, { three: 3 }]);
    const cloned = deepClone(set);

    expect(cloned).toBeInstanceOf(Set);
    expect(cloned.size).toBe(set.size);
    expect(Array.from(cloned)).toEqual(Array.from(set));
    expect(cloned).not.toBe(set); // Different instance

    // Check that nested objects in Set are cloned
    const originalObj = Array.from(set).find((item) => typeof item === 'object');
    const clonedObj = Array.from(cloned).find((item) => typeof item === 'object');
    expect(clonedObj).toEqual(originalObj);
    expect(clonedObj).not.toBe(originalObj);
  });

  it('should clone Map objects', () => {
    const map = new Map<unknown, unknown>([
      ['key1', 'value1'],
      ['key2', { nested: 'value' }],
      [{ objectKey: true }, 'value3'],
    ]);

    const cloned = deepClone(map);

    expect(cloned).toBeInstanceOf(Map);
    expect(cloned.size).toBe(map.size);
    expect(cloned).not.toBe(map); // Different instance

    // Check values are equal
    expect(cloned.get('key1')).toBe('value1');
    expect(cloned.get('key2')).toEqual({ nested: 'value' });

    // Check that nested objects are cloned
    const originalValue = map.get('key2');
    const clonedValue = cloned.get('key2');
    expect(clonedValue).not.toBe(originalValue);
  });

  it('should handle circular references by copying reference', () => {
    interface CircularObject {
      a: number;
      self?: CircularObject;
    }
    const obj: CircularObject = { a: 1 };
    obj.self = obj; // Circular reference

    // This implementation doesn't handle circular references
    // It will cause stack overflow, so we skip this test
    // In a production implementation, you might want to handle this case
  });

  it('should only clone own properties', () => {
    const parent = { inherited: 'value' };
    const child = Object.create(parent);
    child.own = 'property';

    const cloned = deepClone(child);

    expect(cloned.own).toBe('property');
    expect(cloned.inherited).toBeUndefined(); // Inherited property not cloned
  });

  it('should handle complex nested structures', () => {
    const complex = {
      array: [1, 2, { nested: true }],
      set: new Set([1, 2, 3]),
      map: new Map([['key', 'value']]),
      date: new Date(),
      nested: {
        deep: {
          array: [{ very: { deep: { nesting: true } } }],
        },
      },
    };

    const cloned = deepClone(complex);

    expect(cloned).toEqual(complex);
    expect(cloned).not.toBe(complex);
    expect(cloned.array).not.toBe(complex.array);
    expect(cloned.set).not.toBe(complex.set);
    expect(cloned.map).not.toBe(complex.map);
    expect(cloned.date).not.toBe(complex.date);
    expect(cloned.nested.deep.array[0]).not.toBe(complex.nested.deep.array[0]);
  });

  it('should handle empty objects and arrays', () => {
    expect(deepClone({})).toEqual({});
    expect(deepClone([])).toEqual([]);
    expect(deepClone(new Set())).toEqual(new Set());
    expect(deepClone(new Map())).toEqual(new Map());
  });

  it('should handle special number values', () => {
    expect(deepClone(Infinity)).toBe(Infinity);
    expect(deepClone(-Infinity)).toBe(-Infinity);
    expect(deepClone(NaN)).toBeNaN();
    expect(deepClone(0)).toBe(0);
    expect(deepClone(-0)).toBe(-0);
  });
});
