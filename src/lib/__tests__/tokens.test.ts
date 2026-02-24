import { describe, it, expect } from 'vitest';
import { generateSigningToken, generateApiKey, hashSignature } from '../tokens';

describe('generateSigningToken', () => {
  it('returns string with ch_sign_ prefix', () => {
    const token = generateSigningToken();
    expect(token).toMatch(/^ch_sign_/);
  });

  it('has consistent length (ch_sign_ + 64 hex chars = 72)', () => {
    const token = generateSigningToken();
    expect(token).toHaveLength(72);
  });

  it('generates unique tokens each call', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateSigningToken()));
    expect(tokens.size).toBe(10);
  });
});

describe('generateApiKey', () => {
  it('returns key with ch_live_ prefix for live environment', () => {
    const { key } = generateApiKey('live');
    expect(key).toMatch(/^ch_live_/);
  });

  it('returns key with ch_test_ prefix for test environment', () => {
    const { key } = generateApiKey('test');
    expect(key).toMatch(/^ch_test_/);
  });

  it('prefix is first 16 chars of key', () => {
    const { key, prefix } = generateApiKey('live');
    expect(prefix).toBe(key.slice(0, 16));
    expect(prefix).toHaveLength(16);
  });

  it('hash is SHA-256 hex (64 chars)', () => {
    const { hash } = generateApiKey('live');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates unique keys each call', () => {
    const keys = new Set(Array.from({ length: 10 }, () => generateApiKey('test').key));
    expect(keys.size).toBe(10);
  });
});

describe('hashSignature', () => {
  it('returns SHA-256 hex string', () => {
    const hash = hashSignature('test-data');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic', () => {
    const a = hashSignature('same-input');
    const b = hashSignature('same-input');
    expect(a).toBe(b);
  });

  it('different input produces different output', () => {
    const a = hashSignature('input-a');
    const b = hashSignature('input-b');
    expect(a).not.toBe(b);
  });
});
