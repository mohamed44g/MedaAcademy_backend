import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
export interface Video {
  id?: number;
  chapter_id: number;
  title: string;
  url: string;
  key_url?: string; // Added key_url to store encryption key URL
  duration?: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class VideoModel {
  constructor(private dbService: DatabaseService) {}

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  async createVideo(
    video: Omit<Video, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Video> {
    const query = `
      INSERT INTO videos (chapter_id, title, url, duration, key_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    if (!video.duration) {
      throw new BadRequestException('Duration is required');
    }
    const values = [
      video.chapter_id,
      video.title,
      video.url,
      video.duration,
      video.key_url,
    ];
    const result = await this.dbService.query(query, values);
    return result[0];
  }

  async findVideosByChapterId(chapterId: number): Promise<Video[]> {
    const query = 'SELECT * FROM videos WHERE chapter_id = $1;';
    return await this.dbService.query(query, [chapterId]);
  }

  async findVideoById(id: number): Promise<Video | null> {
    const query = 'SELECT * FROM videos WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result[0] || null;
  }

  async getVideoByIdentifier(identifier: string): Promise<Video | null> {
    const query = 'SELECT * FROM videos WHERE identifier = $1;';
    const result = await this.dbService.query(query, [identifier]);
    return result[0] || null;
  }

  async updateVideo(
    id: number,
    updates: Partial<Video>,
  ): Promise<Video | null> {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = Object.values(updates);
    const query = `
      UPDATE videos
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length + 1}
      RETURNING *;
    `;
    const result = await this.dbService.query(query, [...values, id]);
    return result[0] || null;
  }

  async deleteVideo(id: number): Promise<void> {
    const query = 'DELETE FROM videos WHERE id = $1;';
    await this.dbService.query(query, [id]);
  }

  async validateChapterId(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM chapters WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result.length > 0;
  }

  async markVideoAsFinished(videoId: number, userId: number): Promise<void> {
    const query = `
      INSERT INTO completed_videos (user_id, video_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, video_id) DO NOTHING;
    `;
    await this.dbService.query(query, [userId, videoId]);
  }

  async getVideo(videoId: number) {
    const query = 'SELECT id, url FROM videos WHERE id = $1';
    const result = await this.dbService.query(query, [videoId]);
    return result[0];
  }

  async getVideoContent(videoId: number, userId: number): Promise<any> {
    const query = `
      SELECT 
        v.id AS video_id,
        v.title AS video_title,
        v.duration AS video_duration,
        v.url AS video_url,
        EXISTS (
          SELECT 1 FROM completed_videos cv
          WHERE cv.video_id = v.id AND cv.user_id = $2
        ) AS is_completed,
        ch.id AS chapter_id,
        ch.title AS chapter_title,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', v2.id,
                'title', v2.title,
                'duration', v2.duration,
                'isCompleted', EXISTS (
                  SELECT 1 FROM completed_videos cv2
                  WHERE cv2.video_id = v2.id AND cv2.user_id = $2
                )
              )
            )
            FROM videos v2
            WHERE v2.chapter_id = ch.id
          ), '[]'::json
        ) AS chapter_videos,
        c.id AS course_id,
        c.title AS course_title,
        i.name AS course_instructor,
        s.name AS course_specialty
      FROM videos v
      JOIN chapters ch ON v.chapter_id = ch.id
      JOIN courses c ON ch.course_id = c.id
      LEFT JOIN instructors i ON c.instructor_id = i.id
      LEFT JOIN specialties s ON c.specialty_id = s.id
      WHERE v.id = $1;
    `;
    const result = await this.dbService.query(query, [videoId, userId]);

    if (!result.length) {
      throw new NotFoundException('Video not found');
    }

    const video = result[0];
    const videoContent = {
      id: video.video_id,
      title: video.video_title,
      duration: this.formatDuration(video.video_duration),
      durationInSeconds: video.video_duration,
      videoUrl: video.video_url,
      isCompleted: video.is_completed,
      chapter: {
        id: video.chapter_id,
        title: video.chapter_title,
        videos: video.chapter_videos.map((v: any) => ({
          id: v.id,
          title: v.title,
          duration: this.formatDuration(v.duration),
          isCompleted: v.isCompleted,
        })),
      },
      course: {
        id: video.course_id,
        title: video.course_title,
        instructor: video.course_instructor,
        specialty: video.course_specialty || 'Unknown',
      },
    };

    return videoContent;
  }
}
