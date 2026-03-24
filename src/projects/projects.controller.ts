import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { DeleteImageDto } from './dto/upload-image.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ProjectsService } from './providers/projects.service';
import { ImageUploadService } from './services/image-upload.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  //______________________ Endpoint to create a new project (CREATOR role required)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all projects with filtering and pagination' })
  @ApiOkResponse({ description: 'Projects retrieved successfully' })
  async findAll(@Query() query: GetProjectsQueryDto) {
    const { data, total } = await this.projectsService.findAll(query);
    return {
      data,
      total,
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
    };
  }

  //_____________________ Endpoint to get detailed project info by ID (public view)
  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed project by ID' })
  @ApiOkResponse({ description: 'Project details retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOnePublic(id);
  }

  //_____________________ Endpoint to create a new project (CREATOR role required)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new project (CREATOR role required)' })
  @ApiCreatedResponse({ description: 'Project created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden – only CREATOR role allowed',
  })
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    const userId = req.user.sub;
    const project = await this.projectsService.create(createProjectDto, userId);
    return project;
  }

  //_____________________ Endpoint to upload project images
  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images'))
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload images to project (CREATOR or ADMIN required)' })
  @ApiCreatedResponse({ description: 'Images uploaded successfully' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiForbiddenResponse({ description: 'Only creator or admin can upload images' })
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  //_____________________ Endpoint to pause a project
  @Patch(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause a project (CREATOR or ADMIN required)' })
  @ApiOkResponse({ description: 'Project paused successfully' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiForbiddenResponse({ description: 'Only creator or admin can pause project' })
  async pauseProject(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProjectStatusDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    const images = await this.imageUploadService.uploadImages(id, files, userId, userRole);
    return { images };
  }

  //_____________________ Endpoint to get project images
  @Get(':id/images')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get project images' })
  @ApiOkResponse({ description: 'Images retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async getProjectImages(@Param('id') id: string) {
    const images = await this.imageUploadService.getProjectImages(id);
    return { images };
  }

  //_____________________ Endpoint to delete project image
  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project image (CREATOR or ADMIN required)' })
  @ApiOkResponse({ description: 'Image deleted successfully' })
  @ApiNotFoundResponse({ description: 'Image not found' })
  @ApiForbiddenResponse({ description: 'Only creator or admin can delete images' })
  async deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    const project = await this.projectsService.updateStatus(
      id,
      { status: 'paused' as any, reason: updateStatusDto.reason },
      userId,
      userRole,
    );
    return project;
  }

  //_____________________ Endpoint to resume a project
  @Patch(':id/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a project (CREATOR or ADMIN required)' })
  @ApiOkResponse({ description: 'Project resumed successfully' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiForbiddenResponse({ description: 'Only creator or admin can resume project' })
  async resumeProject(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProjectStatusDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    const project = await this.projectsService.updateStatus(
      id,
      { status: 'active' as any, reason: updateStatusDto.reason },
      userId,
      userRole,
    );
    return project;
  }

  //_____________________ Endpoint to complete a project
  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a project (CREATOR or ADMIN required)' })
  @ApiOkResponse({ description: 'Project completed successfully' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiForbiddenResponse({ description: 'Only creator or admin can complete project' })
  async completeProject(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProjectStatusDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const userRole = req.user.role;
    await this.imageUploadService.deleteImage(imageId, userId, userRole);
    return { message: 'Image deleted successfully' };
    const project = await this.projectsService.updateStatus(
      id,
      { status: 'completed' as any, reason: updateStatusDto.reason },
      userId,
      userRole,
    );
    return project;
  }
}
