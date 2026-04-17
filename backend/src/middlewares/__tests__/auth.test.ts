/**
 * Tests para el middleware de autenticación.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types';

// Mock env
vi.mock('../../config/env', () => ({
  env: { JWT_SECRET: 'test-secret-key-for-testing' },
}));

const { signToken } = await import('../../utils/jwt');
const { authMiddleware, adminMiddleware } = await import('../../middlewares/auth');

function createMockReq(authHeader?: string): AuthenticatedRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as AuthenticatedRequest;
}

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe('authMiddleware', () => {
  it('should return 401 if no token is provided', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', () => {
    const req = createMockReq('Bearer invalid-token');
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() and set req.user for valid token', () => {
    const token = signToken({ userId: 'u1', user: 'test@test.com', role: 'customer' });
    const req = createMockReq(`Bearer ${token}`);
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.userId).toBe('u1');
    expect(req.user!.role).toBe('customer');
  });
});

describe('adminMiddleware', () => {
  it('should return 401 without token', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 for non-admin user', () => {
    const token = signToken({ userId: 'u1', user: 'test@test.com', role: 'customer' });
    const req = createMockReq(`Bearer ${token}`);
    const res = createMockRes();
    const next = vi.fn();

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() for admin user', () => {
    const token = signToken({ userId: 'u1', user: 'admin@test.com', role: 'admin' });
    const req = createMockReq(`Bearer ${token}`);
    const res = createMockRes();
    const next = vi.fn();

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next() for editor user', () => {
    const token = signToken({ userId: 'u1', user: 'editor@test.com', role: 'editor' });
    const req = createMockReq(`Bearer ${token}`);
    const res = createMockRes();
    const next = vi.fn();

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
