import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export enum ProjectCategory {
  EDUCATION = 'education',
  HEALTH = 'health',
  ENVIRONMENT = 'environment',
  COMMUNITY = 'community',
  TECHNOLOGY = 'technology',
  ARTS = 'arts',
  OTHER = 'other',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectCategory,
    default: ProjectCategory.OTHER,
  })
  category: ProjectCategory;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Column({ type: 'decimal', precision: 18, scale: 7 })
  goalAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 7, default: 0 })
  fundsRaised: number;

  @Column({ nullable: true })
  imageUrl: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  deadline: Date | null;

  @Column()
  creatorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
