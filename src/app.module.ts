import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
import { DatabaseService } from './database/database.service';
import { SpecialtiesModule } from './specialties/specialties.module';
import { CoursesModule } from './courses/courses.module';
import { ChaptersModule } from './chapters/chapters.module';
import { VideosModule } from './videos/videos.module';
import { CommentsModule } from './comments/comments.module';
import { WorkshopsModule } from './workshops/workshops.module';
import { AdminModule } from './admin/admin.module';
import { InstructorsModule } from './instructor/instructors.module';
import { MongoService } from './database/mongo.service';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    SpecialtiesModule,
    CoursesModule,
    ChaptersModule,
    VideosModule,
    CommentsModule,
    WorkshopsModule,
    AdminModule,
    InstructorsModule,
  ],
  providers: [DatabaseService, MongoService],
})
export class AppModule {}
