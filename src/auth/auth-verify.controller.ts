import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

interface VerifyDto {
  walletAddress: string;
  signedChallenge: string;
  challenge: string;
}

interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer' | 'bearer';
}

@ApiTags('auth')
@Controller('auth')
export class AuthVerifyController {
  constructor(private readonly jwt: JwtService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify wallet signature and get JWT token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        walletAddress: { type: 'string', example: 'G...wallet-address' },
        signedChallenge: { type: 'string', example: 'base64-encoded-signature' },
        challenge: { type: 'string', example: 'stellaraid:login:abc123:1234567890' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  @ApiResponse({ status: 400, description: 'Invalid wallet address or missing fields' })
  @ApiResponse({ status: 401, description: 'Signature verification failed' })
  verify(@Body() dto: VerifyDto): AuthResponse {
    const { walletAddress, signedChallenge, challenge } = dto;

    if (!walletAddress || !StrKey.isValidEd25519PublicKey(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }
    if (!signedChallenge || !challenge) {
      throw new BadRequestException('Missing signedChallenge or challenge');
    }

    const keypair = Keypair.fromPublicKey(walletAddress);
    const messageBytes = Buffer.from(challenge, 'utf8');
    const signatureBytes = Buffer.from(signedChallenge, 'base64');

    const valid = keypair.verify(messageBytes, signatureBytes);
    if (!valid) {
      throw new UnauthorizedException('Signature verification failed');
    }

    const accessToken = this.jwt.sign({ sub: walletAddress, walletAddress });
    return { accessToken, tokenType: 'Bearer' };
  }
}