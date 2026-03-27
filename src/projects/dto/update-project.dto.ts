import { IsEnum, IsOptional, IsString, IsUrl, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectCategory } from 'src/common/enums/project-category.enum';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Updated project title/name',
    example: 'Updated Project Title',
  })
  @IsOptional()
  @IsString({ message: 'Project name must be a string' })
  projectName?: string;

  @ApiPropertyOptional({
    description: 'Updated project description',
    example: 'An updated description of the project.',
  })
  @IsOptional()
  @IsString({ message: 'Project description must be a string' })
  projectDesc?: string;

  @ApiPropertyOptional({
    description: 'Updated project image URL',
    example: 'https://example.com/images/updated-image.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Project image must be a valid URL' })
  projectImage?: string;

  @ApiPropertyOptional({
    description: 'Updated project story/detailed narrative',
    example: 'A detailed story about the project impact...',
  })
  @IsOptional()
  @IsString({ message: 'Project story must be a string' })
  story?: string;

  @ApiPropertyOptional({
    description: 'Updated project category',
    enum: ProjectCategory,
    example: ProjectCategory.COMMUNITY,
  })
  @IsOptional()
  @IsEnum(ProjectCategory, { message: 'Invalid project category' })
  category?: ProjectCategory;
}
