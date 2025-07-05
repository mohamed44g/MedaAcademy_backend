import { Module } from '@nestjs/common';
import { CommentController } from './comments.controller';
import { CommentService } from './comments.service';
import { CommentModel } from './comments.model';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService, CommentModel, DatabaseService],
  exports: [CommentService, CommentModel],
})
export class CommentsModule {}
