import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateVideoDto {
  @ApiProperty({
    description: 'Chapter ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  chapter_id?: number;

  @ApiProperty({
    description: 'Video title',
    example: 'Updated Cardiology Basics Video',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;
}
