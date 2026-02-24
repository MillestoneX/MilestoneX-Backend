import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectCategory, ProjectStatus } from '../entities/project.entity';

export enum ProjectSortBy {
  NEWEST = 'newest',
  MOST_FUNDED = 'most_funded',
  ENDING_SOON = 'ending_soon',
}

export class GetProjectsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by project category',
    enum: ProjectCategory,
    example: ProjectCategory.HEALTH,
  })
  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @ApiPropertyOptional({
    description: 'Filter by project status',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Search query for project title/description',
    example: 'education fund',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort projects by',
    enum: ProjectSortBy,
    default: ProjectSortBy.NEWEST,
    example: ProjectSortBy.MOST_FUNDED,
  })
  @IsOptional()
  @IsEnum(ProjectSortBy)
  sortBy?: ProjectSortBy = ProjectSortBy.NEWEST;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Number of results to skip (for pagination)',
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
