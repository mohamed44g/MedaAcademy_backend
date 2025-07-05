import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { UserModel } from './users.model';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, UserModel, DatabaseService],
  exports: [UserService, UserModel],
})
export class UsersModule {}
