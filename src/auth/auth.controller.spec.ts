import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        walletAddress: 'GABC123...',
      };

      const expectedResult = {
        accessToken: 'jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          walletAddress: 'GABC123...',
        },
      };

      jest.spyOn(authService, 'register').mockResolvedValue(expectedResult);

      const result = await authController.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        accessToken: 'jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          walletAddress: 'GABC123...',
        },
      };

      jest.spyOn(authService, 'login').mockResolvedValue(expectedResult);

      const result = await authController.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});