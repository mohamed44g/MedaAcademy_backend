import { Module } from '@nestjs/common';
import { CourseController, AdminCourseController } from './course.controller';
import { CourseService } from './course.service';
import { CourseModel } from './course.model';
import { DatabaseService } from '../database/database.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/posters',
    }),
  ],
  controllers: [CourseController, AdminCourseController],
  providers: [CourseService, CourseModel, DatabaseService],
  exports: [CourseService, CourseModel],
})
export class CoursesModule {}
