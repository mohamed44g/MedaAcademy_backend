import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Course title',
    example: 'Introduction to Cardiology',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Course description',
    example: 'Learn the basics of cardiology.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Course price' })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  price: number;

  @ApiProperty({ description: 'Specialty ID' })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  specialty_id: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'must be an image file',
    required: true,
    name: 'poster',
  })
  poster: Express.Multer.File;

  //instractor
  @ApiProperty({
    description: 'Instractor name',
    example: 'Dr. John Doe',
    required: true,
    name: 'instractor_id',
    type: 'string',
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  instractor_id: number;
}
