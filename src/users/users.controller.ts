import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus, Patch, Param, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SubmitKYCDto } from './dtos/submit-kyc.dto';
import { UpdateKYCDto } from './dtos/update-kyc.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ProfileResponseDto } from './dtos/profile-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@Controller('users')
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload): Promise<ProfileResponseDto> {
    return this.usersService.getProfile(user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ProfileResponseDto> {
    return this.usersService.updateProfile(user.sub, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const user = req.user;
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto.token, resetDto.newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('kyc/submit')
  @HttpCode(HttpStatus.OK)
  async submitKYC(@Request() req, @Body() submitKYCDto: SubmitKYCDto) {
    const user = req.user;
    return this.authService.submitKYC(user.id, submitKYCDto);
  }

  // Admin endpoint to update KYC status
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/kyc/:userId')
  @HttpCode(HttpStatus.OK)
  async updateKYCStatus(
    @Request() req,
    @Param('userId') userId: string,
    @Body() updateKYCDto: UpdateKYCDto,
  ) {
    // Check if requester is admin
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return this.authService.updateKYCStatus(userId, updateKYCDto);
  }
}
