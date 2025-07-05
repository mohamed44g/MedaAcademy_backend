import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsInt,
  IsEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    required: false,
    example: 'Ahmed Mohamed',
  })
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Phone number',
    required: false,
    example: '+201234567890',
  })
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Specialty ID', required: false, example: 1 })
  @IsInt()
  specialty_id?: number;

  @ApiProperty({
    description: 'Password (min 8 characters)',
    required: false,
    example: 'NewPassword123',
  })
  @IsString()
  @MinLength(8)
  password?: string;
}
