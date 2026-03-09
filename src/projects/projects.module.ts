import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Donation } from './entities/donation.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './providers/projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Donation])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
