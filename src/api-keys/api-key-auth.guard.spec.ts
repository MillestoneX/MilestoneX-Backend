import { ExecutionContext } from '@nestjs/common';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { ApiKeyGuard } from './api-key.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

const mockApiKeyGuard = {
  canActivate: jest.fn(),
};

const mockJwtAuthGuard = {
  canActivate: jest.fn(),
};

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ApiKeyAuthGuard(
      mockApiKeyGuard as unknown as ApiKeyGuard,
      mockJwtAuthGuard as unknown as JwtAuthGuard,
    );
  });

  it('delegates to ApiKeyGuard when X-API-Key is present', async () => {
    mockApiKeyGuard.canActivate.mockResolvedValue(true);

    const request: TestRequest = { headers: { 'x-api-key': 'sk_test' } };
    const context = createContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockApiKeyGuard.canActivate).toHaveBeenCalledWith(context);
    expect(mockJwtAuthGuard.canActivate).not.toHaveBeenCalled();
  });

  it('authenticates via JWT and normalizes the payload when no API key is sent', async () => {
    mockJwtAuthGuard.canActivate.mockImplementation((ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest() as TestRequest;
      req.user = { sub: 'user-1', walletAddress: 'GADDR', role: 'DONOR' };
      return true;
    });

    const request: TestRequest = { headers: {} };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(request.user).toMatchObject({
      sub: 'user-1',
      userId: 'user-1',
      walletAddress: 'GADDR',
      role: 'DONOR',
      authMethod: 'jwt',
    });
    expect(mockApiKeyGuard.canActivate).not.toHaveBeenCalled();
  });

  it('returns false when JWT authentication fails', async () => {
    mockJwtAuthGuard.canActivate.mockReturnValue(false);

    const request: TestRequest = { headers: {} };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(
      false,
    );
    expect(mockApiKeyGuard.canActivate).not.toHaveBeenCalled();
  });
});
