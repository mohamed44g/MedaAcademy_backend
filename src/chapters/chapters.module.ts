import { Module } from '@nestjs/common';
import { ChapterController } from './chapters.controller';
import { ChapterService } from './chapters.service';
import { ChapterModel } from './chapters.model';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [ChapterController],
  providers: [ChapterService, ChapterModel, DatabaseService],
  exports: [ChapterService, ChapterModel],
})
export class ChaptersModule {}
