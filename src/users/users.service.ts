import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, KYCStatus } from './entities/user.entity';
import { ProfileResponseDto } from './dtos/profile-response.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateWalletAddress(
    userId: string,
    walletAddress: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    user.walletAddress = walletAddress;
    return this.userRepository.save(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.findById(userId);

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.country !== undefined) user.country = dto.country;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.walletAddress !== undefined) user.walletAddress = dto.walletAddress;

    try {
      await this.userRepository.save(user);
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(
          'Wallet address is already linked to another account',
        );
      }
      throw err;
    }

    return this.getProfile(userId);
  }

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.findById(userId);

    // 6 checkpoints: email, firstName, lastName (always present),
    // email verified, wallet address set, KYC approved
    const completionChecks = [
      true,
      true,
      true,
      user.isEmailVerified,
      user.walletAddress !== null,
      user.kycStatus === KYCStatus.APPROVED,
    ];
    const completed = completionChecks.filter(Boolean).length;
    const profileCompletionPercentage = Math.round(
      (completed / completionChecks.length) * 100,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      walletAddress: user.walletAddress,
      country: user.country,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      kycStatus: user.kycStatus,
      kycSubmittedAt: user.kycSubmittedAt,
      kycVerifiedAt: user.kycVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profileCompletionPercentage,
    };
  }
}
