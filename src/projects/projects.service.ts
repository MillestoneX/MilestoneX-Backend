import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import {
  GetProjectsQueryDto,
  ProjectSortBy,
} from './dtos/get-projects-query.dto';
import { CreateProjectDto } from './dtos/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) { }

  async create(
    createProjectDto: CreateProjectDto,
    creatorId: string,
  ): Promise<Project> {
    const { projectName, projectDesc, projectImage, fundingGoal, deadline, category } =
      createProjectDto;

    // Validate that the deadline is in the future
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      throw new BadRequestException('Deadline must be a valid date');
    }
    if (deadlineDate <= new Date()) {
      throw new BadRequestException('Deadline must be a future date');
    }

    const project = this.projectRepository.create({
      title: projectName,
      description: projectDesc,
      imageUrl: projectImage,
      goalAmount: fundingGoal,
      deadline: deadlineDate,
      status: ProjectStatus.PENDING,
      progress: 0,
      donationCount: 0,
      fundsRaised: 0,
      creatorId,
      ...(category && { category }),
    });

    return this.projectRepository.save(project);
  }

  async findAll(
    query: GetProjectsQueryDto,
  ): Promise<{ data: Partial<Project>[]; total: number }> {
    const {
      category,
      status,
      search,
      sortBy = ProjectSortBy.NEWEST,
      limit = 10,
      offset = 0,
    } = query;

    const qb: SelectQueryBuilder<Project> = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.creator', 'creator')
      .select([
        'project.id',
        'project.title',
        'project.description',
        'project.category',
        'project.status',
        'project.goalAmount',
        'project.fundsRaised',
        'project.imageUrl',
        'project.deadline',
        'project.createdAt',
        'project.updatedAt',
        // creator info — sensitive fields excluded
        'creator.id',
        'creator.firstName',
        'creator.lastName',
        'creator.walletAddress',
      ]);

    // Default: only APPROVED or ACTIVE projects unless a specific status is requested
    if (status) {
      qb.where('project.status = :status', { status });
    } else {
      qb.where('project.status IN (:...statuses)', {
        statuses: [ProjectStatus.APPROVED, ProjectStatus.ACTIVE],
      });
    }

    if (category) {
      qb.andWhere('project.category = :category', { category });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(project.title) LIKE :search OR LOWER(project.description) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    switch (sortBy) {
      case ProjectSortBy.MOST_FUNDED:
        qb.orderBy('project.fundsRaised', 'DESC');
        break;
      case ProjectSortBy.ENDING_SOON:
        qb.orderBy('project.deadline', 'ASC');
        break;
      case ProjectSortBy.NEWEST:
      default:
        qb.orderBy('project.createdAt', 'DESC');
        break;
    }

    const total = await qb.getCount();

    const data = await qb.skip(offset).take(limit).getMany();

    return { data, total };
  }
}
