import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_EMAIL } from '../queue/queue.constants';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockEmailQueue = {
  add: jest.fn(),
};

describe('NotificationsService – sendCampaignSuspensionEmail', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(QUEUE_EMAIL), useValue: mockEmailQueue },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('throws when creator user is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.sendCampaignSuspensionEmail({
        creatorId: 'unknown-user',
        campaignId: 'c1',
        campaignTitle: 'My Campaign',
        reason: 'Policy violation',
      }),
    ).rejects.toThrow(/not found/);
  });

  it('throws when creator has no email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: null,
      displayName: 'Test User',
    });

    await expect(
      service.sendCampaignSuspensionEmail({
        creatorId: 'u1',
        campaignId: 'c1',
        campaignTitle: 'My Campaign',
        reason: 'Policy violation',
      }),
    ).rejects.toThrow(/no email/);
  });

  it('queues an email and creates an in-app notification on success', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'creator@example.com',
      displayName: 'Test User',
    });
    mockEmailQueue.add.mockResolvedValue({});
    mockPrisma.notification.create.mockResolvedValue({});

    await service.sendCampaignSuspensionEmail({
      creatorId: 'u1',
      campaignId: 'c1',
      campaignTitle: 'My Campaign',
      reason: 'Policy violation',
    });

    expect(mockEmailQueue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ to: 'creator@example.com' }),
    );
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          title: 'Campaign Suspended',
        }),
      }),
    );
  });
});

describe('NotificationsService – getNotifications', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(QUEUE_EMAIL), useValue: mockEmailQueue },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('returns notifications for a user', async () => {
    const fakeNotifications = [{ id: 'n1', title: 'Hello', isRead: false }];
    mockPrisma.notification.findMany.mockResolvedValue(fakeNotifications);
    mockPrisma.notification.count.mockResolvedValue(1);

    const result = await service.getNotifications('u1');

    expect(result.data).toEqual(fakeNotifications);
    expect(result.total).toBe(1);
  });

  it('filters by isRead when provided', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);

    await service.getNotifications('u1', false);

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isRead: false }),
      }),
    );
  });
});
