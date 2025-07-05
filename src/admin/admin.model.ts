import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface DashboardStats {
  total_users: number;
  total_courses: number;
  total_videos: number;
  total_comments: number;
  completed_videos: number;
  active_users_daily: number;
  active_users_weekly: number;
  new_comments_daily: number;
  storage_used_mb: number;
  total_workshops: number;
  total_workshop_registrations: number;
}

@Injectable()
export class AdminModel {
  constructor(private dbService: DatabaseService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const usersQuery = 'SELECT COUNT(*) as count FROM users WHERE status = $1;';
    const coursesQuery = 'SELECT COUNT(*) as count FROM courses;';
    const videosQuery = 'SELECT COUNT(*) as count FROM videos;';
    const commentsQuery =
      'SELECT COUNT(*) as count FROM comments WHERE approved = TRUE;';
    const completedVideosQuery =
      'SELECT COUNT(*) as count FROM user_videos WHERE completed = TRUE;';
    const activeUsersDailyQuery = `
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_videos
      WHERE created_at >= NOW() - INTERVAL '1 day';
    `;
    const activeUsersWeeklyQuery = `
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_videos
      WHERE created_at >= NOW() - INTERVAL '7 days';
    `;
    const newCommentsDailyQuery = `
      SELECT COUNT(*) as count
      FROM comments
      WHERE created_at >= NOW() - INTERVAL '1 day' AND approved = TRUE;
    `;
    const workshopsQuery = 'SELECT COUNT(*) as count FROM workshops;';
    const workshopRegistrationsQuery =
      'SELECT COUNT(*) as count FROM workshop_registrations;';

    const [
      usersResult,
      coursesResult,
      videosResult,
      commentsResult,
      completedVideosResult,
      activeUsersDailyResult,
      activeUsersWeeklyResult,
      newCommentsDailyResult,
      workshopsResult,
      workshopRegistrationsResult,
    ] = await Promise.all([
      this.dbService.query(usersQuery, ['active']),
      this.dbService.query(coursesQuery),
      this.dbService.query(videosQuery),
      this.dbService.query(commentsQuery),
      this.dbService.query(completedVideosQuery),
      this.dbService.query(activeUsersDailyQuery),
      this.dbService.query(activeUsersWeeklyQuery),
      this.dbService.query(newCommentsDailyQuery),
      this.dbService.query(workshopsQuery),
      this.dbService.query(workshopRegistrationsQuery),
    ]);

    let storageUsedMb = 0;
    try {
      const videoFiles = await fs.readdir(
        join(__dirname, '..', '..', 'Uploads', 'videos'),
      );
      const workshopImages = await fs.readdir(
        join(__dirname, '..', '..', 'Uploads', 'workshops'),
      );
      const fileSizes = await Promise.all(
        [
          ...videoFiles.map((file) =>
            join(__dirname, '..', '..', 'Uploads', 'videos', file),
          ),
          ...workshopImages.map((file) =>
            join(__dirname, '..', '..', 'Uploads', 'workshops', file),
          ),
        ].map(async (filePath) => {
          const stats = await fs.stat(filePath);
          return stats.size;
        }),
      );
      storageUsedMb =
        fileSizes.reduce((sum, size) => sum + size, 0) / (1024 * 1024);
    } catch (error) {
      console.error('Error calculating storage size:', error);
    }

    return {
      total_users: parseInt(usersResult[0].count, 10),
      total_courses: parseInt(coursesResult[0].count, 10),
      total_videos: parseInt(videosResult[0].count, 10),
      total_comments: parseInt(commentsResult[0].count, 10),
      completed_videos: parseInt(completedVideosResult[0].count, 10),
      active_users_daily: parseInt(activeUsersDailyResult[0].count, 10),
      active_users_weekly: parseInt(activeUsersWeeklyResult[0].count, 10),
      new_comments_daily: parseInt(newCommentsDailyResult[0].count, 10),
      storage_used_mb: Math.round(storageUsedMb * 100) / 100,
      total_workshops: parseInt(workshopsResult[0].count, 10),
      total_workshop_registrations: parseInt(
        workshopRegistrationsResult[0].count,
        10,
      ),
    };
  }

  async getPopularCourses(limit: number = 5): Promise<any[]> {
    const query = `
      SELECT c.id, c.title, COUNT(uv.video_id) as completed_count
      FROM courses c
      JOIN chapters ch ON ch.course_id = c.id
      JOIN videos v ON v.chapter_id = ch.id
      JOIN user_videos uv ON uv.video_id = v.id
      WHERE uv.completed = TRUE
      GROUP BY c.id, c.title
      ORDER BY completed_count DESC
      LIMIT $1;
    `;
    return await this.dbService.query(query, [limit]);
  }

  async getPopularVideos(limit: number = 5): Promise<any[]> {
    const query = `
      SELECT v.id, v.title, v.url, COUNT(uv.video_id) as view_count
      FROM videos v
      JOIN user_videos uv ON uv.video_id = v.id
      GROUP BY v.id, v.title, v.url
      ORDER BY view_count DESC
      LIMIT $1;
    `;
    return await this.dbService.query(query, [limit]);
  }

  async getCourseCompletionRates(): Promise<any[]> {
    const query = `
      SELECT c.id, c.title, 
             COUNT(uv.video_id) as completed_videos,
             (SELECT COUNT(*) FROM videos v JOIN chapters ch ON v.chapter_id = ch.id WHERE ch.course_id = c.id) as total_videos,
             ROUND(
               (COUNT(uv.video_id)::FLOAT / 
                NULLIF((SELECT COUNT(*) FROM videos v JOIN chapters ch ON v.chapter_id = ch.id WHERE ch.course_id = c.id), 0)) * 100, 
               2
             ) as completion_rate
      FROM courses c
      LEFT JOIN chapters ch ON ch.course_id = c.id
      LEFT JOIN videos v ON v.chapter_id = ch.id
      LEFT JOIN user_videos uv ON uv.video_id = v.id AND uv.completed = TRUE
      GROUP BY c.id, c.title
      ORDER BY completion_rate DESC;
    `;
    return await this.dbService.query(query);
  }

  async getPendingComments(): Promise<any[]> {
    const query = `
      SELECT c.*, u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.approved = FALSE
      ORDER BY c.created_at DESC;
    `;
    return await this.dbService.query(query);
  }
}
