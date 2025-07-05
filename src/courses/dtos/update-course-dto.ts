import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateCourseDto {
  @ApiProperty({
    description: 'Course title',
    required: false,
    example: 'Advanced Cardiology',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    description: 'Course description',
    required: false,
    example: 'Advanced topics in cardiology.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Course price',
    required: false,
    example: 149.99,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  price?: number;

  @ApiProperty({ description: 'Specialty ID', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  specialty_id?: number;

  @ApiProperty({
    description: 'Course poster',
    required: false,
    example: 'course-123.jpg',
  })
  @IsOptional()
  poster?: string;
}
