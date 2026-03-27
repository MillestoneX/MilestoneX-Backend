import { KYCStatus } from 'src/common/enums/kyc-status.enum';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';

@Entity('users')
@Index('IDX_users_email', ['email'])
@Index('IDX_users_wallet_address', ['walletAddress'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true, unique: true, type: 'varchar' })
  walletAddress: string | null;

  @Column({ nullable: true, type: 'varchar' })
  country: string | null;

  @Column({ nullable: true, type: 'text' })
  bio: string | null;

  @Column({ nullable: true, type: 'varchar' })
  avatarUrl: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true, type: 'varchar' })
  emailVerificationToken: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  emailVerificationTokenExpiry: Date | null;

  @Column({ nullable: true, type: 'varchar' })
  resetPasswordTokenSelector: string | null;

  @Column({ nullable: true, type: 'varchar' })
  resetPasswordTokenHash: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  resetPasswordTokenExpiry: Date | null;

  @Column({ nullable: true, type: 'varchar' })
  refreshTokenHash: string | null;

  @Column({
    type: 'enum',
    enum: KYCStatus,
    default: KYCStatus.NONE,
  })
  kycStatus: KYCStatus;

  @Column({ nullable: true, type: 'timestamp' })
  kycSubmittedAt: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  kycVerifiedAt: Date | null;

  @Column({ nullable: true, type: 'varchar' })
  kycDocumentUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  kycRejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
