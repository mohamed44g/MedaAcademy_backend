import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Res,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './videos.service';
import { CreateVideoDto } from './dtos/create-video-dto';
import { UpdateVideoDto } from './dtos/update-video-dto';
import { Public } from '../decorators/routes.decorator';
import { Roles } from '../decorators/user.role.decoratros';
import { IPayload, Role } from '../utils/types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { response } from '../utils/response';
import { userPayload } from 'src/decorators/user.decorators';
import { CourseModel } from 'src/courses/course.model';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Response, Request } from 'express';
import { SkipTransform } from 'src/decorators/transform.decorator';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
@ApiTags('Videos')
@Controller('/videos')
export class VideoController {
  private s3Client: S3Client;
  constructor(
    private videoService: VideoService,
    private configService: ConfigService,
  ) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const endpoint = this.configService.get<string>('S3_ENDPOINT');

    if (!region || !accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error(
        'Missing required S3 configuration (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_ENDPOINT)',
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle: true, // Required for S3-compatible storage like MinIO
    });
  }

  @Post()
  @Roles(Role.admin, Role.super_admin)
  @UseInterceptors(
    FileInterceptor('video', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only MP4, MPEG, MOV are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Create a new video for a chapter (MP4, MPEG, MOV, max 100MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Cardiology Basics Video 1' },
        chapter_id: { type: 'integer', example: 1 },
        video: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Video created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or file type' })
  @ApiBearerAuth()
  async createVideo(
    @Body() dto: CreateVideoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const video = await this.videoService.createVideo(dto, file);
    return response('Video created successfully', video);
  }

  @Roles(Role.admin, Role.super_admin, Role.user)
  @Get('segment')
  @ApiOperation({ summary: 'Get signed URL for a video segment' })
  @ApiQuery({ name: 'videoId', type: String, required: true })
  @ApiQuery({ name: 'segment', type: String, required: true })
  @ApiResponse({
    status: 200,
    description: 'Segment URL retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async getSegment(
    @Query() data: any,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if (req.headers.origin != 'https://localhost:3001') {
      return res.status(403).send('Forbidden');
    }

    const signedUrl = await this.videoService.getSegment(
      data.videoId,
      data.segment,
    );

    res.set({
      'Content-Type': 'video/mp2t',
    });

    res.redirect(signedUrl);
  }

  @Roles(Role.admin, Role.super_admin, Role.user)
  @Get('key-request')
  @ApiOperation({ summary: 'Get encryption key for a video' })
  @ApiQuery({ name: 'videoId', type: String, required: true })
  @ApiResponse({ status: 200, description: 'Key retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Video or key not found' })
  async getVideoKey(
    @Query('videoId') videoId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if (req.headers.origin != 'https://localhost:3001') {
      return res.status(403).send('Forbidden');
    }
    const keyBuffer = await this.videoService.getKey(videoId);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': keyBuffer.length,
    });
    res.send(keyBuffer);
  }

  @Roles(Role.admin, Role.super_admin, Role.user)
  @Get(':videoId/content')
  @ApiOperation({
    summary: 'Get video content with course and chapter details',
  })
  @ApiResponse({
    status: 200,
    description: 'Video content retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async getVideoContent(
    @Param('videoId', ParseIntPipe) videoId: number,
    @userPayload() user: IPayload,
  ) {
    const videoContent = await this.videoService.getVideoContent(
      videoId,
      user.id,
    );
    return response('Video content retrieved successfully', videoContent);
  }

  @Public()
  @Get(':chapterId')
  @ApiOperation({ summary: 'Get all videos for a chapter' })
  @ApiResponse({
    status: 200,
    description: 'Videos retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async findVideosByChapterId(
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ) {
    const videos = await this.videoService.findVideosByChapterId(chapterId);
    return response('Videos retrieved successfully', videos);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  @ApiResponse({ status: 200, description: 'Video found' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async findVideoById(@Param('id', ParseIntPipe) id: number) {
    const video = await this.videoService.findVideoById(id);
    return response('Video retrieved successfully', video);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.super_admin)
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({ summary: 'Update a video (MP4, MPEG, MOV, max 100MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Updated Cardiology Basics Video',
          nullable: true,
        },
        chapter_id: { type: 'integer', example: 1, nullable: true },
        duration: { type: 'integer', example: 350, nullable: true },
        video: { type: 'string', format: 'binary', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Video updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiBearerAuth()
  async updateVideo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVideoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const videoPath = file ? `/uploads/videos/${file.filename}` : undefined;
    const video = await this.videoService.updateVideo(id, dto, videoPath);
    return response('Video updated successfully', video);
  }

  @Delete(':id')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete a video' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiBearerAuth()
  async deleteVideo(@Param('id', ParseIntPipe) id: number) {
    await this.videoService.deleteVideo(id);
    return response('Video deleted successfully', null);
  }

  @Post(':videoId/finish')
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Mark a video as finished' })
  @ApiResponse({
    status: 200,
    description: 'Video marked as finished successfully',
  })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiBearerAuth()
  async markVideoAsFinished(
    @Param('videoId', ParseIntPipe) videoId: number,
    @userPayload() user: IPayload,
  ) {
    await this.videoService.markVideoAsFinished(videoId, user.id);
    return response('Video marked as finished successfully', null);
  }
}
