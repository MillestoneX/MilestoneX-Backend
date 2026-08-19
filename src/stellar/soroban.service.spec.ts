import { SorobanService } from './soroban.service';
import { ConfigService } from '@nestjs/config';

const mockConfig = {
  get: jest.fn(),
};

describe('SorobanService – RPC endpoint configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to the testnet Soroban RPC URL when STELLAR_RPC_URL is unset', () => {
    mockConfig.get.mockImplementation(() => undefined);

    const service = new SorobanService(mockConfig as unknown as ConfigService);

    const url = service.getServer().serverURL.toString();
    expect(url).toContain('soroban-testnet.stellar.org');
  });

  it('derives the RPC URL from STELLAR_RPC_URL when configured', () => {
    mockConfig.get.mockImplementation((key: string) =>
      key === 'STELLAR_RPC_URL' ? 'https://rpc.example.com:443' : undefined,
    );

    const service = new SorobanService(mockConfig as unknown as ConfigService);

    const url = service.getServer().serverURL.toString();
    expect(url).toContain('rpc.example.com');
  });

  it('delegates getTransaction to the configured RPC server', async () => {
    mockConfig.get.mockImplementation(() => undefined);
    const service = new SorobanService(mockConfig as unknown as ConfigService);

    const server = service.getServer();
    const getTransactionSpy = jest
      .spyOn(server, 'getTransaction')
      .mockResolvedValue({
        status: 'SUCCESS',
      } as never);

    await expect(service.getTransaction('tx123')).resolves.toEqual({
      status: 'SUCCESS',
    });
    expect(getTransactionSpy).toHaveBeenCalledWith('tx123');
  });
});
