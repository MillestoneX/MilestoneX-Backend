import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitKYCDto {
  @IsString()
  @IsNotEmpty()
  documentUrl: string;
}
