import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateVideoDto {
  @ApiProperty({
    description: 'Chapter ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  chapter_id: number;

  @ApiProperty({
    description: 'Video title',
    example: 'Cardiology Basics Video 1',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  duration?: number;
}
