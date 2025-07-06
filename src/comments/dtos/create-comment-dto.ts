import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';


export class CreateCommentDto {
  @ApiProperty({
    description: 'Video ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  video_id: number;

  @ApiProperty({
    description: 'Comment content',
    example: 'This video was very helpful!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
