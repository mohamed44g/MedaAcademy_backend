import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsInt,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Ahmed Mohamed',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'ahmed@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+201234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Specialty ID', example: 1 })
  @IsInt()
  specialty_id: number;

  @ApiProperty({
    description: 'Password (min 8 characters)',
    example: 'Password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Fingerprint', example: 'device_token' })
  @IsString()
  @IsNotEmpty()
  fingerprint: string;

  @ApiProperty({ description: 'Verification code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
