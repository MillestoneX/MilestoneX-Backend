import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { GetProjectsQueryDto } from './dtos/get-projects-query.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all projects with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async findAll(@Query() query: GetProjectsQueryDto) {
    const { data, total } = await this.projectsService.findAll(query);
    return {
      data,
      total,
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
    };
  }
}
