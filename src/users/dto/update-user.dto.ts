import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/** DTO for updating the authenticated user's profile */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Display name shown publicly',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;

  @ApiPropertyOptional({ description: 'Short user bio', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description:
      'Social links as a key/value object (e.g. { twitter: "...", github: "..." })',
  })
  @IsOptional()
  socialLinks?: Record<string, string>;
}
