import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSpecialtieDto {
  @ApiProperty({
    description: 'Specialty name',
    required: true,
    example: 'طب بشرى',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
