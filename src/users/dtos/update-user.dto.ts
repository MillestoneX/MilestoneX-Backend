import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User country',
    example: 'United States',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'User bio/description',
    example: 'Passionate about social impact projects',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL',
    example: 'https://example.com/avatar.jpg',
    format: 'url',
  })
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Stellar wallet public key (G...)',
    example: 'GAA2M7F4E3C4D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
    pattern: '^G[A-Z2-7]{55}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'walletAddress must be a valid Stellar public key',
  })
  walletAddress?: string;
}
