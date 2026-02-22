import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Patch, Param, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SubmitKYCDto } from './dtos/submit-kyc.dto';
import { UpdateKYCDto } from './dtos/update-kyc.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

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
