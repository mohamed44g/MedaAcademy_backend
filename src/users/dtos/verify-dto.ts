import { IsEmail } from 'class-validator';

export class VerifyDto {
  @IsEmail()
  email: string;
}
