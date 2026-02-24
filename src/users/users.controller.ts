import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus, Patch, Param, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<ProfileResponseDto> {
    return this.usersService.getProfile(user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: ProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ProfileResponseDto> {
    return this.usersService.updateProfile(user.sub, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const user = req.user;
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto.token, resetDto.newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Post('kyc/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit KYC document for verification' })
  @ApiResponse({ status: 200, description: 'KYC submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitKYC(@Request() req, @Body() submitKYCDto: SubmitKYCDto) {
    const user = req.user;
    return this.authService.submitKYC(user.id, submitKYCDto);
  }

  // Admin endpoint to update KYC status
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Patch('admin/kyc/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update KYC status (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to update KYC for' })
  @ApiResponse({ status: 200, description: 'KYC status updated successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
