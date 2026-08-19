import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from '../prisma/prisma.service';

interface TestRequest {
  headers: Record<string, string | undefined>;
  user?: Record<string, unknown>;
}

const createContext = (request: TestRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

const mockPrisma = {
  apiKey: {
    findUnique: jest.fn(),
  },
};

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ApiKeyGuard(mockPrisma as unknown as PrismaService);
  });

  it('authenticates a valid key and normalizes the user shape', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      isActive: true,
      scope: 'read',
      user: { id: 'user-1', walletAddress: 'GADDR', role: 'DONOR' },
    });

    const request: TestRequest = {
      headers: { 'x-api-key': 'sk_test' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(request.user).toEqual({
      sub: 'user-1',
      userId: 'user-1',
      walletAddress: 'GADDR',
      role: 'DONOR',
      authMethod: 'apiKey',
      apiKeyId: 'key-1',
      scope: 'read',
    });
  });

  it('rejects a revoked (isActive: false) key with 401', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      isActive: false,
      scope: 'read',
      user: { id: 'user-1', walletAddress: 'GADDR', role: 'DONOR' },
    });

    const request: TestRequest = { headers: { 'x-api-key': 'sk_revoked' } };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'Invalid or revoked API key',
    );
  });

  it('rejects a missing X-API-Key header with 401', async () => {
    const request: TestRequest = { headers: {} };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockPrisma.apiKey.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an unknown key with 401', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue(null);

    const request: TestRequest = { headers: { 'x-api-key': 'sk_unknown' } };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'Invalid or revoked API key',
    );
  });
});
