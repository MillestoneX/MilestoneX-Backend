import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  campaign: { findUnique: jest.fn() },
  smartContract: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('ContractsService', () => {
  let service: ContractsService;

  const dto = {
    contractId: 'CCONTRACT',
    campaignId: 'campaign-1',
    network: 'testnet',
    deployerAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    jest.clearAllMocks();
  });

  it('throws NotFoundException when the campaign is missing', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue(null);

    await expect(
      service.createContract(dto, 'creator-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockPrisma.smartContract.create).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when the caller is not the campaign creator', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      creatorId: 'creator-1',
    });

    await expect(
      service.createContract(dto, 'someone-else'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockPrisma.smartContract.create).not.toHaveBeenCalled();
  });

  it('registers a contract when the campaign creator requests it', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      creatorId: 'creator-1',
    });
    mockPrisma.smartContract.findUnique.mockResolvedValue(null);
    mockPrisma.smartContract.create.mockResolvedValue({
      id: 'contract-record-1',
      ...dto,
    });

    const result = await service.createContract(dto, 'creator-1');

    expect(mockPrisma.smartContract.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contractId: dto.contractId,
          campaignId: dto.campaignId,
          deployerAddress: dto.deployerAddress,
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ id: 'contract-record-1' }),
    );
  });

  it('throws BadRequestException when the campaign already has a contract', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'campaign-1',
      creatorId: 'creator-1',
    });
    mockPrisma.smartContract.findUnique.mockResolvedValue({
      contractId: 'already-linked',
    });

    await expect(
      service.createContract(dto, 'creator-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockPrisma.smartContract.create).not.toHaveBeenCalled();
  });
});
