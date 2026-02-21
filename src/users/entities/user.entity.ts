import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    CREATOR = 'creator',
    DONOR = 'donor',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
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
    refreshTokenHash: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
