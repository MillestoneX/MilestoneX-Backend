import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    CREATOR = 'creator',
    DONOR = 'donor',
}

export enum KYCStatus {
    NONE = 'none',
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

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

    @Column({ nullable: true, unique: true })
    walletAddress: string | null;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ default: false })
    isEmailVerified: boolean;

    @Column({ nullable: true })
    emailVerificationToken: string | null;

    @Column({ nullable: true, type: 'timestamp' })
    emailVerificationTokenExpiry: Date | null;

    @Column({ nullable: true })
    resetPasswordTokenSelector: string | null;

    @Column({ nullable: true })
    resetPasswordTokenHash: string | null;

    @Column({ nullable: true, type: 'timestamp' })
    resetPasswordTokenExpiry: Date | null;

    @Column({ nullable: true })
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

    @Column({ nullable: true })
    kycDocumentUrl: string | null;

    @Column({ nullable: true })
    kycRejectionReason: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
