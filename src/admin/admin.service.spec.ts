import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockNotificationsService = {
  sendCampaignSuspensionEmail: jest.fn(),
};

const mockPrisma = {
  campaign: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  donation: {
    findUnique: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
  dispute: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AdminService – refundDonation', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('throws NotFoundException when donation does not exist', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const txMock = {
        donation: { findUnique: jest.fn().mockResolvedValue(null) },
        campaign: { update: jest.fn() },
      };
      return fn(txMock);
    });

    await expect(service.refundDonation('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when donation is not CONFIRMED', async () => {
    const pendingDonation = { id: 'd1', status: 'PENDING', campaignId: 'c1', amount: '10' };

    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const txMock = {
        donation: { findUnique: jest.fn().mockResolvedValue(pendingDonation) },
        campaign: { update: jest.fn() },
      };
      return fn(txMock);
    });

    await expect(service.refundDonation('d1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refunds a CONFIRMED donation and recalculates campaign stats atomically', async () => {
    const confirmedDonation = {
      id: 'd1',
      status: 'CONFIRMED',
      campaignId: 'c1',
      amount: { toString: () => '50' },
      assetCode: 'XLM',
      donorId: 'u1',
      txHash: 'tx1',
      updatedAt: new Date(),
    };
    const refundedDonation = { ...confirmedDonation, status: 'REFUNDED' };

    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const txMock = {
        donation: {
          findUnique: jest.fn().mockResolvedValue(confirmedDonation),
          update: jest.fn().mockResolvedValue(refundedDonation),
          aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
        },
        campaign: { update: jest.fn().mockResolvedValue({}) },
      };
      return fn(txMock);
    });

    const result = await service.refundDonation('d1');

    expect(result.status).toBe('REFUNDED');
    expect(result.id).toBe('d1');
  });
});

describe('AdminService – suspendCampaign', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('throws NotFoundException when campaign does not exist', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue(null);

    await expect(
      service.suspendCampaign('nonexistent', { reason: 'spam' } as any, 'admin1', 'admin@test.com'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when campaign is already cancelled', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'c1',
      status: 'CANCELLED',
      title: 'Test',
      creatorId: 'u1',
    });

    await expect(
      service.suspendCampaign('c1', { reason: 'spam' } as any, 'admin1', 'admin@test.com'),
    ).rejects.toThrow(BadRequestException);
  });

  it('suspends an active campaign and sends notification', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'c1',
      status: 'ACTIVE',
      title: 'Good Campaign',
      creatorId: 'u1',
    });
    mockPrisma.campaign.update.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockNotificationsService.sendCampaignSuspensionEmail.mockResolvedValue(undefined);

    const result = await service.suspendCampaign(
      'c1',
      { reason: 'TOS violation' } as any,
      'admin1',
      'admin@test.com',
    );

    expect(result.notificationSent).toBe(true);
    expect(mockPrisma.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CANCELLED' } }),
    );
  });
});
