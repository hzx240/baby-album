import { IsString, IsOptional, IsNumber, IsDateString, Min, IsEnum, IsInt } from 'class-validator';

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

export class GetWHOStandardsDto {
  @IsEnum(['height', 'weight', 'headCirc'])
  measurementType: 'height' | 'weight' | 'headCirc';

  @IsEnum(['male', 'female'])
  gender: 'male' | 'female';

  @IsInt()
  @Min(0)
  ageMonths: number;
}
