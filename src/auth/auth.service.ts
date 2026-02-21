import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { AuthResponse, JwtPayload } from './interfaces/auth.interface';
import type { EmailService } from './interfaces/email.interface';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class AuthService {
  // Token expiry time in hours
  private readonly TOKEN_EXPIRY_HOURS = 24;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService?: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with bcrypt (min 10 rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Generate email verification token with expiry (24 hours)
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationTokenExpiry = new Date();
    emailVerificationTokenExpiry.setHours(
      emailVerificationTokenExpiry.getHours() + this.TOKEN_EXPIRY_HOURS,
    );

    // Create user with default role if not specified
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      walletAddress: registerDto.walletAddress,
      role: registerDto.role || UserRole.DONOR,
      emailVerificationToken,
      emailVerificationTokenExpiry,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Send verification email
    await this.sendVerificationEmail(savedUser.email, savedUser.firstName, emailVerificationToken);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
      walletAddress: savedUser.walletAddress,
      role: savedUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return sanitized user object (no password)
    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        walletAddress: savedUser.walletAddress,
        role: savedUser.role,
        isEmailVerified: savedUser.isEmailVerified,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return sanitized user object (no password)
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        walletAddress: user.walletAddress,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: payload.sub },
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const { token } = verifyEmailDto;

    // Find user by verification token
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    // Check if token has expired
    if (
      user.emailVerificationTokenExpiry &&
      new Date() > user.emailVerificationTokenExpiry
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new verification email.',
      );
    }

    // Mark user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null as unknown as string;
    user.emailVerificationTokenExpiry = null as unknown as Date;

    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerification(
    resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const { email } = resendVerificationDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    // Generate new verification token with expiry
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationTokenExpiry = new Date();
    emailVerificationTokenExpiry.setHours(
      emailVerificationTokenExpiry.getHours() + this.TOKEN_EXPIRY_HOURS,
    );

    // Update user with new token
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpiry = emailVerificationTokenExpiry;
    await this.userRepository.save(user);

    // Send verification email
    await this.sendVerificationEmail(user.email, user.firstName, emailVerificationToken);

    return { message: 'Verification email sent successfully' };
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    if (this.emailService) {
      await this.emailService.sendVerificationEmail(email, token, firstName);
    } else {
      // Log verification link for development/testing
      console.log(`[Email Verification] To: ${email}`);
      console.log(`[Email Verification] Token: ${token}`);
      console.log(`[Email Verification] Link: /auth/verify-email?token=${token}`);
    }
  }
}