/**
 * Tests para el módulo JWT (signToken, verifyToken).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock env before importing jwt utils
vi.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-testing',
  },
}));

// Import after mock
const { signToken, verifyToken } = await import('../jwt');

describe('JWT Utils', () => {
  const payload = { userId: 'user-123', user: 'test@example.com', role: 'admin' };

  it('should sign a valid token', () => {
    const token = signToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
  });

  it('should verify a valid token and return payload', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe('user-123');
    expect(decoded.user).toBe('test@example.com');
    expect(decoded.role).toBe('admin');
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('should throw on invalid token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow();
  });

  it('should throw on tampered token', () => {
    const token = signToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('should respect custom expiration', () => {
    const token = signToken(payload, '1s');
    const decoded = verifyToken(token);
    // Token should expire ~1 second from now
    const expiry = decoded.exp! - decoded.iat!;
    expect(expiry).toBe(1);
  });
});
