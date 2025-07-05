import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReplayDto {
  @ApiProperty({
    example: 'Hello',
    description: 'Comment content',
    required: true,
  })
  @IsString()
  content: string;
}
