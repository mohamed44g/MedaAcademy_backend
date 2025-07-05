import { Module } from '@nestjs/common';
import { VideoController } from './videos.controller';
import { VideoService } from './videos.service';
import { VideoModel } from './videos.model';
import { DatabaseService } from '../database/database.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `video-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|mpeg|mov)$/)) {
          return cb(
            new BadRequestException(
              'Only MP4, MPEG, and MOV files are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    }),
  ],
  controllers: [VideoController],
  providers: [VideoService, VideoModel, DatabaseService],
  exports: [VideoService, VideoModel],
})
export class VideosModule {}
