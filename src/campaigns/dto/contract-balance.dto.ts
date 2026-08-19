import { ApiProperty } from '@nestjs/swagger';

/** Represents an on-chain asset balance for a Stellar account */
export class AssetBalanceDto {
  @ApiProperty({
    description: 'Asset code (e.g. `XLM`, `USDC`)',
    example: 'USDC',
  })
  assetCode: string;

  @ApiProperty({
    description: 'Issuer account for issued assets; absent for native XLM',
    required: false,
  })
  assetIssuer?: string;

  @ApiProperty({
    description: 'On-chain balance as a decimal string',
    example: '50.0000000',
  })
  balance: string;

  @ApiProperty({
    description: 'Whether this is the native (XLM) asset',
    example: false,
  })
  isNative: boolean;
}

export class ContractBalanceResponseDto {
  @ApiProperty({
    description: 'Soroban contract account ID',
    example: 'GBC…',
  })
  contractId: string;

  @ApiProperty({
    description:
      'On-chain balances reported per asset. Heterogeneous assets are never summed.',
    type: [AssetBalanceDto],
  })
  balances: AssetBalanceDto[];

  @ApiProperty({
    description:
      'Stored per-asset raised totals (keys: `XLM` or `CODE:ISSUER`). ' +
      'Provided for comparison; this endpoint never overwrites stored totals.',
    example: { XLM: '100.0000000', 'USDC:GBD…': '50.0000000' },
  })
  storedRaisedByAsset: Record<string, string>;
}
