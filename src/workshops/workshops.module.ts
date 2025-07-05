import { Module } from '@nestjs/common';
import { WorkshopController } from './workshops.controller';
import { WorkshopService } from './workshops.service';
import { WorkshopModel } from './workshops.model';
import { DatabaseService } from '../database/database.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './Uploads/workshops',
    }),
  ],
  controllers: [WorkshopController],
  providers: [WorkshopService, WorkshopModel, DatabaseService],
  exports: [WorkshopService, WorkshopModel],
})
export class WorkshopsModule {}
