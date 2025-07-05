import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { InstructorsService } from './instructors.service';
import { InstructorsModel } from './instructors.model';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [InstructorsController],
  providers: [InstructorsService, InstructorsModel, DatabaseService],
})
export class InstructorsModule {}
