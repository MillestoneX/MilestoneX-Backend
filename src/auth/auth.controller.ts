import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { AuthResponse } from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req): Promise<AuthResponse> {
    return this.authService.login(loginDto, req);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(resendVerificationDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto);
  }
}