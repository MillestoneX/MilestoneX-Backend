import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/entities/user.entity';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn(),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should deny access when no user is present in request', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      jest.spyOn(mockContext.switchToHttp(), 'getRequest').mockReturnValue({
        user: null,
      });
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should allow access when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      jest.spyOn(mockContext.switchToHttp(), 'getRequest').mockReturnValue({
        user: { role: UserRole.ADMIN },
      });
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.CREATOR]);
      jest.spyOn(mockContext.switchToHttp(), 'getRequest').mockReturnValue({
        user: { role: UserRole.CREATOR },
      });
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      jest.spyOn(mockContext.switchToHttp(), 'getRequest').mockReturnValue({
        user: { role: UserRole.USER },
      });
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should deny access when user role is not in multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.CREATOR]);
      jest.spyOn(mockContext.switchToHttp(), 'getRequest').mockReturnValue({
        user: { role: UserRole.USER },
      });
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(false);
    });

    it('should check both handler and class for roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.DONOR]);
      jest.spyOn(mockContext.switchToHttp(), 'getRequest').mockReturnValue({
        user: { role: UserRole.DONOR },
      });
      
      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'roles',
        [mockContext.getHandler(), mockContext.getClass()]
      );
    });
  });
});
