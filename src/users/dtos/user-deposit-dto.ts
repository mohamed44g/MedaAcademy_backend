import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DepositUserWalletBalanceDto {
  @ApiProperty({
    example: 100,
    description: 'Amount to deposit',
    required: true,
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amount: number;
}
