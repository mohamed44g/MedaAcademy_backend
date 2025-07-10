import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgetPasswordDto {
  @ApiProperty({
    example: 'medaplus56@gmail.com',
    description: 'User email',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  email: string;
}
