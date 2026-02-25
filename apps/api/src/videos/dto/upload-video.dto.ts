import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class UploadVideoDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsBooleanString()
  isPremium!: string;

  @IsOptional()
  @IsString()
  trimStart?: string;

  @IsOptional()
  @IsString()
  trimEnd?: string;

  @IsOptional()
  @IsBooleanString()
  allowTranscode?: string;
}
