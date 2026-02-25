import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    example: UserRole.CREATOR,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
