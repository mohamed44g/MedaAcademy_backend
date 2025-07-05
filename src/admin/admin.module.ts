import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminModel } from './admin.model';
import { DatabaseService } from '../database/database.service';
import { UserService } from '../users/users.service';
import { CourseService } from '../courses/course.service';
import { CommentService } from '../comments/comments.service';
import { WorkshopService } from '../workshops/workshops.service';
import { UserModel } from 'src/users/users.model';
import { CommentModel } from 'src/comments/comments.model';
import { CourseModel } from 'src/courses/course.model';
import { WorkshopModel } from 'src/workshops/workshops.model';
import { ChapterModel } from 'src/chapters/chapters.model';
import { VideoModel } from 'src/videos/videos.model';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminModel,
    DatabaseService,
    UserService,
    CourseService,
    CommentService,
    WorkshopService,
    UserModel,
    CommentModel,
    CourseModel,
    WorkshopModel,
    ChapterModel,
    VideoModel,
  ],
  exports: [AdminService, AdminModel],
})
export class AdminModule {}
