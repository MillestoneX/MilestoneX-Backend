import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { GetProjectsQueryDto } from './dtos/get-projects-query.dto';
import { CreateProjectDto } from './dtos/create-project.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

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

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed project by ID' })
  @ApiResponse({ status: 200, description: 'Project details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOnePublic(id);
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new project (CREATOR role required)' })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – only CREATOR role allowed',
  })
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    const userId = req.user.sub;
    const project = await this.projectsService.create(
      createProjectDto,
      userId,
    );
    return project;
  }
}
