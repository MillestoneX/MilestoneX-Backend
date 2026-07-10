import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

interface VerifyDto {
  walletAddress: string;
  signedChallenge: string;
  challenge: string;
}

interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer' | 'bearer';
}

/**
 * POST /auth/verify
 *
 * Verifies the Ed25519 signature, upserts the user on first login (#225),
 * applies the admin-wallet allowlist (#222), and returns a signed JWT.
 */
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthVerifyController {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Post('verify')
  async verify(@Body() dto: VerifyDto): Promise<AuthResponse> {
    const { walletAddress, signedChallenge, challenge } = dto;

    // ── Step 1: Validate the wallet address format ───────────────────────────
    // Must be a valid 56-character Stellar Ed25519 public key (G-address).
    if (!walletAddress || !StrKey.isValidEd25519PublicKey(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }
    if (!signedChallenge || !challenge) {
      throw new BadRequestException('Missing signedChallenge or challenge');
    }

    // ── Step 2: Verify the Ed25519 signature ─────────────────────────────────
    // The client must sign the raw UTF-8 bytes of `challenge` with their private
    // key and encode the result as base64.  We decode and verify here.
    const keypair = Keypair.fromPublicKey(walletAddress);
    const messageBytes = Buffer.from(challenge, 'utf8');
    const signatureBytes = Buffer.from(signedChallenge, 'base64');

    const valid = keypair.verify(messageBytes, signatureBytes);
    if (!valid) {
      throw new UnauthorizedException('Signature verification failed');
    }

    // ── Step 3: Resolve role from the admin allowlist ─────────────────────────
    // ADMIN_WALLETS is a comma-separated list of wallet addresses that should
    // automatically receive the ADMIN role on login.  All others default to USER.
    const adminWallets = this.config
      .get<string>('ADMIN_WALLETS', '')
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    const isAdmin = adminWallets.includes(walletAddress);
    const roleFromAllowlist: UserRole | undefined = isAdmin
      ? UserRole.ADMIN
      : undefined;

    // ── Step 4: Upsert user (create on first login) ───────────────────────────
    // Derives a short display name from the wallet address (e.g. "GABCD...XY12").
    // On subsequent logins, only the role is updated (if the allowlist changed).
    const displayName = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    const user = await this.prisma.user.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        displayName,
        role: roleFromAllowlist ?? UserRole.USER,
      },
      update: roleFromAllowlist ? { role: roleFromAllowlist } : {},
    });

    const role = roleFromAllowlist ?? user.role;

    // ── Step 5: Issue a signed JWT ────────────────────────────────────────────
    // Payload: { sub: userId, walletAddress, role }
    // The `sub` claim is the database UUID — used as the canonical user identifier
    // in all downstream guards and services.
    const accessToken = this.jwt.sign({
      sub: user.id,
      walletAddress,
      role,
    });

    return { accessToken, tokenType: 'Bearer' };
  }
}
