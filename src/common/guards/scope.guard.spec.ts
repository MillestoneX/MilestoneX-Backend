import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScopeGuard } from './scope.guard';

interface TestRequest {
  user?: { authMethod?: string; scope?: string };
}

const createContext = (request: TestRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as unknown as ExecutionContext;

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

describe('ScopeGuard', () => {
  let guard: ScopeGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ScopeGuard(mockReflector as unknown as Reflector);
  });

  it('allows requests when no scopes are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('allows JWT-authenticated requests regardless of scope', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['read']);

    expect(
      guard.canActivate(createContext({ user: { authMethod: 'jwt' } })),
    ).toBe(true);
  });

  it('allows an API key whose scope is permitted', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['read']);

    expect(
      guard.canActivate(
        createContext({ user: { authMethod: 'apiKey', scope: 'read' } }),
      ),
    ).toBe(true);
  });

  it('rejects an API key whose scope is not permitted', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['write']);

    expect(() =>
      guard.canActivate(
        createContext({ user: { authMethod: 'apiKey', scope: 'read' } }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects an API key with no scope', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['read']);

    expect(() =>
      guard.canActivate(createContext({ user: { authMethod: 'apiKey' } })),
    ).toThrow(ForbiddenException);
  });
});
