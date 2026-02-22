import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');
jest.mock('ejs');
jest.mock('fs');

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config = {
                'APP_NAME': 'StellarAid',
                'FRONTEND_URL': 'http://localhost:3000',
                'MAIL_FROM': 'noreply@stellaraid.com',
                'MAIL_SUBJECT_PREFIX': '[StellarAid]',
                'MAIL_HOST': 'smtp.gmail.com',
                'MAIL_PORT': 587,
                'MAIL_SECURE': false,
                'MAIL_USER': 'test@example.com',
                'MAIL_PASS': 'test-password',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    const mockUser = {
      email: 'test@example.com',
      firstName: 'John',
      username: 'johndoe',
    };

    it('should send welcome email successfully', async () => {
      const mockTemplate = '<html>Welcome <%= firstName %></html>';
      const mockRenderedHtml = '<html>Welcome John</html>';

      (require('fs').readFileSync as jest.Mock).mockReturnValue(mockTemplate);
      (require('ejs').render as jest.Mock).mockResolvedValue(mockRenderedHtml);

      await service.sendWelcomeEmail(mockUser);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@stellaraid.com',
        to: mockUser.email,
        subject: '[StellarAid] Welcome to StellarAid!',
        html: mockRenderedHtml,
      });
    });

    it('should handle user without firstName', async () => {
      const userWithoutFirstName = {
        email: 'test@example.com',
        username: 'johndoe',
      };

      const mockTemplate = '<html>Welcome <%= firstName || username %></html>';
      const mockRenderedHtml = '<html>Welcome johndoe</html>';

      (require('fs').readFileSync as jest.Mock).mockReturnValue(mockTemplate);
      (require('ejs').render as jest.Mock).mockResolvedValue(mockRenderedHtml);

      await service.sendWelcomeEmail(userWithoutFirstName);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: userWithoutFirstName.email,
          subject: '[StellarAid] Welcome to StellarAid!',
        })
      );
    });

    it('should handle email sending errors', async () => {
      const mockTemplate = '<html>Welcome <%= firstName %></html>';
      (require('fs').readFileSync as jest.Mock).mockReturnValue(mockTemplate);
      (require('ejs').render as jest.Mock).mockResolvedValue('<html>Welcome John</html>');

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(service.sendWelcomeEmail(mockUser)).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendLoginEmail', () => {
    const mockUser = {
      email: 'test@example.com',
      firstName: 'John',
      username: 'johndoe',
    };

    const mockMetadata = {
      ip: '192.168.1.1',
      device: 'Chrome on Windows',
      time: new Date('2023-01-01T10:00:00Z'),
    };

    it('should send login email with metadata', async () => {
      const mockTemplate = '<html>Login detected from <%= ip %></html>';
      const mockRenderedHtml = '<html>Login detected from 192.168.1.1</html>';

      (require('fs').readFileSync as jest.Mock).mockReturnValue(mockTemplate);
      (require('ejs').render as jest.Mock).mockResolvedValue(mockRenderedHtml);

      await service.sendLoginEmail(mockUser, mockMetadata);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@stellaraid.com',
        to: mockUser.email,
        subject: '[StellarAid] New Login Notification',
        html: mockRenderedHtml,
      });
    });

    it('should send login email without metadata', async () => {
      const mockTemplate = '<html>Login detected</html>';
      const mockRenderedHtml = '<html>Login detected</html>';

      (require('fs').readFileSync as jest.Mock).mockReturnValue(mockTemplate);
      (require('ejs').render as jest.Mock).mockResolvedValue(mockRenderedHtml);

      await service.sendLoginEmail(mockUser);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          subject: '[StellarAid] New Login Notification',
        })
      );
    });

    it('should use current time when metadata time is not provided', async () => {
      const mockTemplate = '<html>Login at <%= loginTime %></html>';
      const mockRenderedHtml = '<html>Login at current time</html>';

      (require('fs').readFileSync as jest.Mock).mockReturnValue(mockTemplate);
      (require('ejs').render as jest.Mock).mockResolvedValue(mockRenderedHtml);

      await service.sendLoginEmail(mockUser, {});

      expect(require('ejs').render).toHaveBeenCalledWith(
        mockTemplate,
        expect.objectContaining({
          loginTime: expect.any(String),
        })
      );
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      const service = new MailService(configService);
      const maskedEmail = (service as any).maskEmail('test@example.com');
      expect(maskedEmail).toBe('te***@example.com');
    });

    it('should handle short email usernames', () => {
      const service = new MailService(configService);
      const maskedEmail = (service as any).maskEmail('ab@example.com');
      expect(maskedEmail).toBe('a*@example.com');
    });

    it('should handle empty email', () => {
      const service = new MailService(configService);
      const maskedEmail = (service as any).maskEmail('');
      expect(maskedEmail).toBe('unknown');
    });
  });
});
