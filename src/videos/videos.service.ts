import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { VideoModel, Video } from './videos.model';
import { CreateVideoDto } from './dtos/create-video-dto';
import { UpdateVideoDto } from './dtos/update-video-dto';
import getVideoDurationInSeconds from 'get-video-duration';
import { extname, join } from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { generateEncryptionKey } from './generate-key';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const execAsync = promisify(exec);
@Injectable()
export class VideoService {
  private s3Client: S3Client;
  private readonly logger = new Logger(VideoService.name);
  constructor(
    private videoModel: VideoModel,
    private configService: ConfigService,
    private dbService: DatabaseService,
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
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible storage like MinIO
    });
  }

  // async createVideo(dto: CreateVideoDto, videoPath?: string): Promise<Video> {
  //   if (!videoPath) {
  //     throw new BadRequestException('Video file is required');
  //   }

  //   const absolutePath = join(process.cwd(), videoPath);
  //   try {
  //     const duration = Math.round(
  //       await getVideoDurationInSeconds(absolutePath),
  //     );
  //     dto.duration = duration;
  //   } catch (error) {
  //     throw new BadRequestException('Failed to retrieve video duration');
  //   }
  //   const chapterExists = await this.videoModel.validateChapterId(
  //     dto.chapter_id,
  //   );
  //   if (!chapterExists) {
  //     throw new BadRequestException('Invalid chapter ID');
  //   }

  //   return this.videoModel.createVideo({
  //     ...dto,
  //     url: videoPath,
  //   });
  // }

  async findVideosByChapterId(chapterId: number): Promise<Video[]> {
    const chapterExists = await this.videoModel.validateChapterId(chapterId);
    if (!chapterExists) {
      throw new NotFoundException('Chapter not found');
    }
    return this.videoModel.findVideosByChapterId(chapterId);
  }

  async findVideoById(id: number): Promise<Video> {
    const video = await this.videoModel.findVideoById(id);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return video;
  }

  async updateVideo(
    id: number,
    dto: UpdateVideoDto,
    videoPath?: string,
  ): Promise<Video> {
    if (dto.chapter_id) {
      const chapterExists = await this.videoModel.validateChapterId(
        dto.chapter_id,
      );
      if (!chapterExists) {
        throw new BadRequestException('Invalid chapter ID');
      }
    }

    const updates: Partial<Video> = { ...dto };
    if (videoPath) {
      updates.url = videoPath;
    }

    const video = await this.videoModel.updateVideo(id, updates);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return video;
  }

  async deleteVideo(id: number): Promise<void> {
    const video = await this.videoModel.findVideoById(id);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    await this.videoModel.deleteVideo(id);
  }

  async markVideoAsFinished(videoId: number, userId: number): Promise<void> {
    const video = await this.videoModel.findVideoById(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    await this.videoModel.markVideoAsFinished(videoId, userId);
  }

  async createVideo(
    dto: CreateVideoDto,
    file?: Express.Multer.File,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    // Validate file type (MP4, MPEG, MOV)
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only MP4, MPEG, MOV are allowed',
      );
    }

    // Validate chapter_id exists
    const chapterExists = await this.dbService.query(
      'SELECT id FROM chapters WHERE id = $1',
      [dto.chapter_id],
    );
    if (!chapterExists.length) {
      throw new BadRequestException('Invalid chapter_id');
    }

    // Generate unique identifiers
    const identifier = `${Date.now()}${Math.round(Math.random() * 1e9)}`;
    const outputDir = join(process.cwd(), 'temp', identifier);

    this.logger.log(`Creating temporary directory: ${outputDir}`);
    mkdirSync(outputDir, { recursive: true });

    // Generate encryption key
    const { key, keyFilePath, keyUrl } = generateEncryptionKey(
      outputDir,
      identifier,
    );
    const keyHex = key.toString('hex');

    // Write key_info.txt
    const keyInfoPath = join(outputDir, 'key_info.txt');
    writeFileSync(keyInfoPath, `${keyUrl}\n${keyFilePath}`);

    // Convert video to HLS with encryption
    const inputPath = file.path;
    const playlistPath = join(outputDir, 'playlist.m3u8');
    const segmentPattern = join(outputDir, 'segment_%03d.ts');
    const hlsBaseUrl = `https://med-aplus.com/api/videos/segment?videoId=${identifier}&segment=`;
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -hls_time 30 -hls_key_info_file "${keyInfoPath}" -hls_segment_filename "${segmentPattern}" -hls_base_url "${hlsBaseUrl}" -hls_playlist_type vod "${playlistPath}"`;

    try {
      this.logger.log(`Executing FFmpeg command: ${ffmpegCommand}`);
      await execAsync(ffmpegCommand);
    } catch (error) {
      this.logger.error(`FFmpeg error: ${error.message}`);
      throw new BadRequestException(
        `Failed to process video: ${error.message}`,
      );
    }

    // Read and fix playlist content to ensure correct segment URLs
    let playlistContent = readFileSync(playlistPath, 'utf-8');
    this.logger.log(
      `Generated playlist content (before fix):\n${playlistContent}`,
    );

    // Fix URLs by replacing any local paths
    playlistContent = playlistContent.replace(
      /https:\/\/med-aplus.com\/api\/videos\/segment\/[^?]+\/[^?]+(?=segment_\d+\.ts)/g,
      hlsBaseUrl,
    );
    this.logger.log(`Fixed playlist content:\n${playlistContent}`);
    writeFileSync(playlistPath, playlistContent);

    // Upload files to S3
    const bucket = this.configService.get<string>('S3_BUCKET');
    if (!bucket) {
      throw new BadRequestException('S3_BUCKET is not configured');
    }

    const filesToUpload = [
      {
        path: playlistPath,
        key: `videos/${identifier}/playlist.m3u8`,
        contentType: 'application/vnd.apple.mpegurl',
      },
      ...Array.from(
        { length: await this.getSegmentCount(playlistPath) },
        (_, i) => ({
          path: join(outputDir, `segment_${i.toString().padStart(3, '0')}.ts`),
          key: `videos/${identifier}/segment_${i.toString().padStart(3, '0')}.ts`,
          contentType: 'video/mp2t',
        }),
      ),
    ];

    for (const { path, key, contentType } of filesToUpload) {
      if (existsSync(path)) {
        this.logger.log(`Uploading file: ${path} to s3://${bucket}/${key}`);
        try {
          const fileBuffer = readFileSync(path);
          await this.s3Client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: fileBuffer,
              ContentType: contentType,
            }),
          );
          this.logger.log(`Successfully uploaded: ${key}`);
        } catch (error) {
          this.logger.error(`Failed to upload ${key}: ${error.message}`);
          throw new BadRequestException(
            `Failed to upload file ${key}: ${error.message}`,
          );
        }
      } else {
        this.logger.warn(`File not found: ${path}`);
      }
    }

    // Get video duration from input file
    let duration: number;
    try {
      this.logger.log(`Retrieving duration for: ${inputPath}`);
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
      );
      duration = Math.round(parseFloat(stdout));
      this.logger.log(`Video duration: ${duration} seconds`);
    } catch (error) {
      this.logger.error(`FFprobe error: ${error.message}`);
      throw new BadRequestException(
        `Failed to retrieve video duration: ${error.message}`,
      );
    }

    // Insert video into database with key_url
    const query = `
      INSERT INTO videos (chapter_id, title, url, key_url, duration, identifier)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, chapter_id, title, url, key_url, duration, created_at
    `;
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const videoUrl = `${endpoint}/${bucket}/videos/${identifier}/playlist.m3u8`;
    const values = [
      dto.chapter_id,
      dto.title,
      videoUrl,
      keyHex,
      duration,
      identifier,
    ];
    const result = await this.dbService.query(query, values);

    if (!result.length) {
      throw new BadRequestException('Failed to create video');
    }

    // Clean up temporary files
    this.logger.log(`Cleaning up temporary directory: ${outputDir}`);
    require('fs').rmSync(outputDir, { recursive: true, force: true });

    return result[0];
  }
  private async getSegmentCount(playlistPath: string): Promise<number> {
    const playlist = require('fs').readFileSync(playlistPath, 'utf-8');
    return (playlist.match(/segment_\d+\.ts/g) || []).length;
  }

  async getVideo(videoId: number) {
    const video = await this.videoModel.getVideo(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    const signedUrl = await this.getSignedUrl(
      video.url.split('/').slice(3).join('/'),
    ); // Extract key from URL
    return { ...video, signedUrl };
  }

  async getSignedUrl(key: string): Promise<string> {
    const bucket = this.configService.get<string>('S3_BUCKET');
    if (!bucket) {
      throw new BadRequestException('S3_BUCKET is not configured');
    }

    // Remove bucket name from key if present
    const cleanKey = key.startsWith(`${bucket}/`)
      ? key.slice(bucket.length + 1)
      : key;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });
      return signedUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for ${cleanKey}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }

  async getVideoContent(videoId: number, userId: number) {
    const videoContent = await this.videoModel.getVideoContent(videoId, userId);
    if (!videoContent) {
      throw new NotFoundException('Video not found');
    }

    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const bucket = this.configService.get<string>('S3_BUCKET');
    if (!endpoint || !bucket) {
      throw new BadRequestException(
        'S3_ENDPOINT or S3_BUCKET is not configured',
      );
    }
    // Remove protocol and endpoint from signedUrl
    const key = videoContent.videoUrl.replace(
      new RegExp(
        `^https?://${endpoint.replace(/^https?:\/\//, '')}/${bucket}/`,
      ),
      '',
    );
    const signedUrl = await this.getSignedUrl(key);
    return { ...videoContent, signedUrl };
  }

  async getKey(videoId: string): Promise<Buffer> {
    const video = await this.videoModel.getVideoByIdentifier(videoId);
    if (!video || !video.key_url) {
      throw new NotFoundException('Video or key not found');
    }
    // Convert hex string back to binary
    return Buffer.from(video.key_url, 'hex');
  }

  async getSegment(videoId: string, segment: string): Promise<string> {
    const video = await this.videoModel.getVideoByIdentifier(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    const segmentKey = `videos/${videoId}/${segment}`;
    return this.getSignedUrl(segmentKey);
  }
}
