import {
  IsString,
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

export class UpdateChapterDto {
  @ApiProperty({
    description: 'Course ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  course_id?: number;

  @ApiProperty({
    description: 'Chapter title',
    example: 'Advanced Cardiology Topics',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Chapter type',
    enum: ChapterType,
    example: ChapterType.Final,
    required: false,
  })
  @IsEnum(ChapterType)
  @IsOptional()
  type?: ChapterType;
}
