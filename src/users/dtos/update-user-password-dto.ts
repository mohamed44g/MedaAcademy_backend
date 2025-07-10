import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

// make this pattern (

export class UpdateUserPasswordDto {
  @ApiProperty({
    example: '#Password123',
    description: 'User password ',
    required: true,
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    example: '#Password123',
    description: 'User password ',
    required: true,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم',
  })
  password: string;
}
