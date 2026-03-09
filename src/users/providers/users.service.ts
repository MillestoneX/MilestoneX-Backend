import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ProfileResponseDto } from '../dto/profile-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { KYCStatus } from 'src/common/enums/kyc-status.enum';
import { AdminGetUsersQueryDto } from '../dto/admin-get-users-query.dto';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private toAdminUserResponse(user: User) {
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
      deletedAt: user.deletedAt,
    };
  }

  //  find user by ID or throw NotFoundException
  public async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // find user by email
  public async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  //  find user by wallet address
  public async updateWalletAddress(
    userId: string,
    walletAddress: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    user.walletAddress = walletAddress;
    return this.userRepository.save(user);
  }

  // update user profile
  public async updateProfile(
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

  // get user profile with profile completion percentage
  public async getProfile(userId: string): Promise<ProfileResponseDto> {
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

  // Find all users with optional filtering for admin panel
  public async findAllForAdmin(query: AdminGetUsersQueryDto) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NULL');

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.kyc_status) {
      qb.andWhere('user.kycStatus = :kycStatus', {
        kycStatus: query.kyc_status,
      });
    }

    if (query.created_date) {
      const dayStart = new Date(query.created_date);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);

      qb.andWhere('user.createdAt >= :dayStart AND user.createdAt < :nextDay', {
        dayStart,
        nextDay,
      });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip(query.offset ?? 0)
      .take(query.limit ?? 10);

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users.map((user) => this.toAdminUserResponse(user)),
      total,
    };
  }

  // get user by ID for admin view (includes sensitive info)
  public async getUserByIdForAdmin(id: string) {
    const user = await this.findById(id);
    return this.toAdminUserResponse(user);
  }

  // update user role (admin only)
  public async updateUserRole(id: string, role: UserRole) {
    const user = await this.findById(id);
    user.role = role;
    const updatedUser = await this.userRepository.save(user);
    return this.toAdminUserResponse(updatedUser);
  }

  // soft delete user (admin only)
  public async softDeleteUser(id: string) {
    const user = await this.findById(id);
    await this.userRepository.softDelete(user.id);
    return { message: 'User deleted successfully' };
  }
}
