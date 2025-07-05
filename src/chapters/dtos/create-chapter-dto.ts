import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ChapterType {
  Midterm = 'midterm',
  Final = 'final',
}

export class CreateChapterDto {
  @ApiProperty({
    description: 'Course ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  course_id: number;

  @ApiProperty({
    description: 'Chapter title',
    example: 'Introduction to Cardiology Basics',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Chapter type',
    enum: ChapterType,
    example: ChapterType.Midterm,
  })
  @IsEnum(ChapterType)
  @IsNotEmpty()
  type: ChapterType;
}
