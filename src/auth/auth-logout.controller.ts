import {
  Controller,
  Post,
  Req,
  UnauthorizedException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import KeyvRedis from '@keyv/redis';

@ApiTags('auth')
@Controller('auth')
export class AuthLogoutController {
  private readonly keyv: KeyvRedis<string | undefined>;

  constructor() {
    this.keyv = new KeyvRedis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token successfully invalidated' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid token' })
  async logout(@Req() req: Request): Promise<void> {
    const user = req['user'];

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const walletAddress = user.walletAddress;
    if (walletAddress) {
      await this.keyv.del(`refresh:${walletAddress}`);
    }
  }
}