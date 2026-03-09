import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    example: UserRole.CREATOR,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
