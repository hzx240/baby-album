import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateGrowthRecordDto {
  @IsDateString()
  recordDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  headCirc?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGrowthRecordDto {
  @IsOptional()
  @IsDateString()
  recordDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  headCirc?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
