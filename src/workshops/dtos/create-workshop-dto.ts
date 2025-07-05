import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateWorkshopDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  price: number;

  @IsDateString()
  event_date: string;

  @IsString()
  event_time: string;

  image_url: Express.Multer.File;
}
