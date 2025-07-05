import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInstructorDto {
  @ApiProperty({
    example: 'dr. Aysam Alia',
    description: 'Instructor name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'NNU Medical Student | Researcher',
    description: 'Instructor specialization',
  })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiProperty({
    example: 'أستاذ مساعد في كلية الطب...',
    description: 'Instructor bio',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
