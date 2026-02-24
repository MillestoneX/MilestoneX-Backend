import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

@Entity('donations')
@Index('IDX_donations_project_id', ['projectId'])
@Index('IDX_donations_donor_id', ['donorId'])
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.donations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  donorId: string | null;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'donorId' })
  donor: User | null;

  @Column({ type: 'decimal', precision: 18, scale: 7 })
  amount: number;

  @Column({ nullable: true })
  transactionHash: string | null;

  @Column({ default: false })
  isAnonymous: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
