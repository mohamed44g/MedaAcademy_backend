import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstructorDto {
  @ApiProperty({
    example: 'dr. Aysam Alia',
    description: 'Instructor name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'NNU Medical Student | Researcher',
    description: 'Instructor specialization',
  })
  @IsString()
  specialization: string;

  @ApiProperty({
    example: 'أستاذ مساعد في كلية الطب...',
    description: 'Instructor bio',
  })
  @IsString()
  @IsOptional()
  bio?: string;
}
