import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';


export class UpdateWorkshopDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsDateString()
  event_date?: string;

  @IsOptional()
  @IsString()
  event_time?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
