import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectCategory } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name/title',
    example: 'Clean Water for Rural Communities',
  })
  @IsNotEmpty({ message: 'Project name is required' })
  @IsString()
  projectName: string;

  @ApiProperty({
    description: 'Detailed project description',
    example:
      'A fundraising campaign to provide clean drinking water to rural communities in sub-Saharan Africa.',
  })
  @IsNotEmpty({ message: 'Project description is required' })
  @IsString()
  projectDesc: string;

  @ApiProperty({
    description: 'URL of the project image',
    example: 'https://example.com/images/clean-water.jpg',
  })
  @IsNotEmpty({ message: 'Project image URL is required' })
  @IsUrl({}, { message: 'projectImage must be a valid URL' })
  projectImage: string;

  @ApiProperty({
    description: 'Funding goal amount (minimum 1000)',
    example: 50000,
    minimum: 1000,
  })
  @IsNotEmpty({ message: 'Funding goal is required' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Funding goal must be a number' })
  @Min(1000, { message: 'Funding goal must be at least 1000' })
  fundingGoal: number;

  @ApiProperty({
    description: 'Project deadline (must be a future date)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsNotEmpty({ message: 'Deadline is required' })
  @Type(() => Date)
  deadline: Date;

  @ApiPropertyOptional({
    description: 'Project category',
    enum: ProjectCategory,
    default: ProjectCategory.OTHER,
    example: ProjectCategory.COMMUNITY,
  })
  @IsOptional()
  @IsEnum(ProjectCategory, { message: 'Invalid project category' })
  category?: ProjectCategory;
}
