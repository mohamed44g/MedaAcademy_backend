import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Updated: This video is extremely helpful!',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
