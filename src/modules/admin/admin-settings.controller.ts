import { Controller, Get, Patch, Body } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin/settings')
@Roles(UserRole.ADMIN)
export class AdminSettingsController {
  constructor(private readonly platformSettingsService: PlatformSettingsService) {}

  @Get()
  getSettings() {
    return this.platformSettingsService.getSettings();
  }

  @Patch()
  updateSettings(@Body() dto: UpdatePlatformSettingsDto, @CurrentUser() user: any) {
    return this.platformSettingsService.updateSettings(dto, user.id);
  }
}
