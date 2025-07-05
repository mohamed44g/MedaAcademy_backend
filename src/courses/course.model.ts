import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Course {
  title: string;
  description: string;
  price: number;
  specialty_id: number;
  poster: string;
  instractor_id: number;
}

export interface CourseOverview {
  id: number;
  title: string;
  instractor_name: string;
  specialty_name: string;
  description?: string;
  totalVideos: number;
  totalDuration: number;
  students_count: number;
  price: number;
  poster?: string;
  sections: {
    [key: string]: {
      title: string;
      chapters: {
        id: number;
        title: string;
        videos_count: number;
        videos: {
          id: number;
          title: string;
          duration: string;
        }[];
      }[];
    };
  };
}

export interface CourseContent {
  id: number;
  title: string;
  instractor_name: string;
  description?: string;
  totalVideos: number;
  totalDuration: number;
  studentsCount: number;
  progress: number;
  poster?: string;
  sections: {
    [key: string]: {
      title: string;
      description: string;
      chapters: {
        id: number;
        title: string;
        description: string;
        isCompleted: boolean;
        videos: {
          id: number;
          title: string;
          isCompleted: boolean;
        }[];
      }[];
    };
  };
}

@Injectable()
export class CourseModel {
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

  async createCourse(course: Course) {
    const query = `
      INSERT INTO courses (title, description, price, specialty_id, poster, instructor_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      course.title,
      course.description,
      course.price,
      course.specialty_id,
      course.poster,
      course.instractor_id,
    ];
    const result = await this.dbService.query(query, values);
    return result[0];
  }

  async getCoursesByInstructorId(
    instructorId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    courses: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCourses: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const offset = (page - 1) * limit;

    // Query to get courses with aggregated data
    const query = `
    SELECT 
      c.id,
      c.title,
      c.description,
      c.poster,
      c.price,
      COALESCE(SUM(v.duration), 0) as duration,
      COUNT(DISTINCT v.id) as videos_count,
      COUNT(DISTINCT uc.user_id) as students_count,
      ARRAY_AGG(cat.name) FILTER (WHERE cat.name IS NOT NULL) as speciality
    FROM courses c
    LEFT JOIN chapters ch ON c.id = ch.course_id
    LEFT JOIN videos v ON ch.id = v.chapter_id
    LEFT JOIN user_courses uc ON c.id = uc.course_id
    LEFT JOIN course_categories cc ON c.id = cc.course_id
    LEFT JOIN categories cat ON cc.category_id = cat.id
    WHERE c.instructor_id = $1
    GROUP BY c.id, c.title, c.description, c.poster, c.price
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $3
  `;
    const values = [instructorId, limit, offset];

    const courses = await this.dbService.query(query, values);

    // Query to get total count of courses for pagination
    const countQuery = `
    SELECT COUNT(*) as total
    FROM courses
    WHERE instructor_id = $1
  `;
    const countResult = await this.dbService.query(countQuery, [instructorId]);
    const totalCourses = parseInt(countResult[0].total, 10);

    // Format duration as string (e.g., "24 ساعة")
    const formattedCourses = courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      poster: course.poster,
      price: course.price,
      duration: `${Math.round(course.duration / 3600)} ساعة`,
      videosCount: parseInt(course.videos_count, 10),
      studentsCount: parseInt(course.students_count, 10),
      speciality: course.speciality || [],
    }));

    return {
      courses: formattedCourses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit),
        totalCourses,
        hasNextPage: offset + limit < totalCourses,
        hasPreviousPage: page > 1,
      },
    };
  }

  async validateSpecialtyId(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM specialties WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result.length > 0;
  }

  async findAllCourses(
    page: number,
    limit: number,
  ): Promise<{ data: Course[]; total: number }> {
    const offset = (page - 1) * limit;
    const totalQuery = 'SELECT COUNT(*) FROM courses;';
    const totalResult = await this.dbService.query(totalQuery);
    const total = totalResult[0].count;
    const query =
      'SELECT courses.*, specialties.name as specialty_name, instructors.name as instractor_name FROM courses JOIN specialties ON courses.specialty_id = specialties.id JOIN instructors ON courses.instructor_id = instructors.id LIMIT $1 OFFSET $2;';
    const result = await this.dbService.query(query, [limit, offset]);
    return { data: result, total };
  }

  async getLatestCourses(): Promise<any> {
    const query =
      'SELECT courses.*, specialties.name as specialty_name , instructors.name as instractor_name FROM courses JOIN specialties ON courses.specialty_id = specialties.id JOIN instructors ON courses.instructor_id = instructors.id ORDER BY created_at DESC LIMIT 6;';
    return await this.dbService.query(query, []);
  }

  async findCourseById(courseId: number): Promise<CourseOverview> {
    const query = `
      SELECT 
        c.id AS course_id,
        c.title AS course_title,
        c.description AS course_description,
        i.name AS instractor_name,
        c.price,
        c.poster,
        s.name AS specialty_name,
        COALESCE((
          SELECT COUNT(v.id) 
          FROM videos v
          JOIN chapters ch ON v.chapter_id = ch.id
          WHERE ch.course_id = c.id
        ), 0) AS total_videos,
        COALESCE((
          SELECT SUM(v.duration)
          FROM videos v
          JOIN chapters ch ON v.chapter_id = ch.id
          WHERE ch.course_id = c.id
        ), 0) AS total_duration,
        COALESCE((
          SELECT COUNT(uc.user_id) 
          FROM user_courses uc
          WHERE uc.course_id = c.id
        ), 0) AS students_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ch.id,
              'title', ch.title,
              'type', ch.type,
              'videos_count', (
                SELECT COUNT(v.id) 
                FROM videos v 
                WHERE v.chapter_id = ch.id
              ),
              'videos', COALESCE((
                SELECT json_agg(
                  json_build_object(
                    'id', v.id,
                    'title', v.title,
                    'duration', v.duration
                  )
                )
                FROM videos v 
                WHERE v.chapter_id = ch.id
              ), '[]'::json)
            )
          ) FILTER (WHERE ch.id IS NOT NULL), '[]'::json
        ) AS chapters
      FROM courses c
      LEFT JOIN specialties s ON c.specialty_id = s.id
      LEFT JOIN chapters ch ON ch.course_id = c.id
      LEFT JOIN instructors i ON c.instructor_id = i.id
      WHERE c.id = $1
      GROUP BY c.id, c.title, c.description, c.price, c.poster, s.name, i.name;
    `;
    const result = await this.dbService.query(query, [courseId]);

    if (!result.length) {
      throw new NotFoundException('Course not found');
    }

    const course = result[0];
    const courseOverview: CourseOverview = {
      id: course.course_id,
      title: course.course_title,
      instractor_name: course.instractor_name,
      specialty_name: course.specialty_name,
      description: course.course_description,
      totalVideos: parseInt(course.total_videos, 10),
      totalDuration: parseInt(course.total_duration, 10),
      students_count: parseInt(course.students_count, 10),
      price: course.price,
      poster: course.poster,
      sections: {
        midterm: { title: 'جزء midterm', chapters: [] },
        final: { title: 'جزء final', chapters: [] },
      },
    };

    // Group chapters by type (midterm or final)
    (course.chapters || []).forEach((chapter: any) => {
      const section = chapter.type || 'midterm'; // Default to midterm if type is null
      courseOverview.sections[section].chapters.push({
        id: chapter.id,
        title: chapter.title,
        videos_count: parseInt(chapter.videos_count, 10),
        videos: (chapter.videos || []).map((video: any) => ({
          id: video.id,
          duration: this.formatDuration(video.duration),
          title: video.title,
        })),
      });
    });

    return courseOverview;
  }

  async getCourseContent(
    courseId: number,
    userId: number,
  ): Promise<CourseContent> {
    const query = `
      SELECT 
        c.id AS course_id,
        c.title AS course_title,
        i.name AS instractor_name,
        c.description AS course_description,
        c.poster,
        COALESCE((
          SELECT SUM(v.duration)
          FROM videos v
          JOIN chapters ch ON v.chapter_id = ch.id
          WHERE ch.course_id = c.id
        ), 0) AS total_duration,
        COALESCE((
          SELECT COUNT(v.id)
          FROM videos v
          JOIN chapters ch ON v.chapter_id = ch.id
          WHERE ch.course_id = c.id
        ), 0) AS total_videos,
        COALESCE((
          SELECT COUNT(uc.user_id)
          FROM user_courses uc
          WHERE uc.course_id = c.id
        ), 0) AS students_count,
        COALESCE((
          SELECT COUNT(cv.video_id)
          FROM completed_videos cv
          JOIN videos v ON cv.video_id = v.id
          JOIN chapters ch ON v.chapter_id = ch.id
          WHERE ch.course_id = c.id AND cv.user_id = $2
        ), 0) AS completed_videos_count,
        COALESCE((
          SELECT COUNT(v.id)
          FROM videos v
          JOIN chapters ch ON v.chapter_id = ch.id
          WHERE ch.course_id = c.id
        ), 0) AS total_videos,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ch.id,
              'title', ch.title,
              'type', ch.type,
              'isCompleted', (
                SELECT COUNT(v.id) = SUM(CASE WHEN cv.video_id IS NOT NULL THEN 1 ELSE 0 END)
                FROM videos v
                LEFT JOIN completed_videos cv ON v.id = cv.video_id AND cv.user_id = $2
                WHERE v.chapter_id = ch.id
              ),
              'videos', COALESCE((
                SELECT json_agg(
                  json_build_object(
                    'id', v.id,
                    'title', v.title,
                    'duration', v.duration,
                    'isCompleted', EXISTS (
                      SELECT 1 FROM completed_videos cv 
                      WHERE cv.video_id = v.id AND cv.user_id = $2
                    )
                  )
                )
                FROM videos v
                WHERE v.chapter_id = ch.id
              ), '[]'::json)
            )
          ) FILTER (WHERE ch.id IS NOT NULL), '[]'::json
        ) AS chapters
      FROM courses c
      LEFT JOIN instructors i ON c.instructor_id = i.id
      LEFT JOIN chapters ch ON ch.course_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, c.title, c.description, c.poster, i.name;
    `;
    const result = await this.dbService.query(query, [courseId, userId]);

    if (!result.length) {
      throw new NotFoundException('Course not found');
    }

    const course = result[0];
    const totalVideos = parseInt(course.total_videos, 10);
    const completedVideos = parseInt(course.completed_videos_count, 10);
    const progress =
      totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    const courseContent: CourseContent = {
      id: course.course_id,
      title: course.course_title,
      instractor_name: course.instractor_name,
      totalDuration: parseInt(course.total_duration, 10),
      totalVideos: parseInt(course.total_videos, 10),
      description: course.course_description,
      studentsCount: parseInt(course.students_count, 10),
      progress,
      poster: course.poster,
      sections: {
        midterm: {
          title: 'جزء midterm',
          description: 'المفاهيم الأساسية',
          chapters: [],
        },
        final: {
          title: 'جزء final',
          description: 'التطبيقات العملية المتقدمة',
          chapters: [],
        },
      },
    };

    (course.chapters || []).forEach((chapter: any) => {
      const section = chapter.type || 'midterm';
      courseContent.sections[section].chapters.push({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || '',
        isCompleted: chapter.isCompleted,
        videos: (chapter.videos || []).map((video: any) => ({
          id: video.id,
          title: video.title,
          duration: this.formatDuration(video.duration),
          isCompleted: video.isCompleted,
        })),
      });
    });

    return courseContent;
  }

  async updateCourse(
    id: number,
    updates: Partial<Course>,
  ): Promise<Course | null> {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = Object.values(updates);
    const query = `
      UPDATE courses
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length + 1}
      RETURNING *;
    `;
    const result = await this.dbService.query(query, [...values, id]);
    return result[0] || null;
  }

  async deleteCourse(id: number): Promise<void> {
    const query = 'DELETE FROM courses WHERE id = $1;';
    await this.dbService.query(query, [id]);
  }

  async enrollUser(userId: number, courseId: number): Promise<void> {
    //make buy course transaction
    await this.dbService.transaction(async (client) => {
      // Check if user is already enrolled
      const isEnrolledQuery = `
        SELECT 1
        FROM user_courses
        WHERE user_id = $1 AND course_id = $2;
      `;
      const isEnrolledResult = await client.query(isEnrolledQuery, [
        userId,
        courseId,
      ]);
      if (isEnrolledResult.rows.length > 0) {
        throw new BadRequestException(
          'User is already enrolled in this course',
        );
      }

      // Get course price and title
      const courseQuery = `
        SELECT price, title
        FROM courses
        WHERE id = $1;
      `;
      const courseResult = await client.query(courseQuery, [courseId]);
      if (!courseResult.rows.length) {
        throw new NotFoundException('Course not found');
      }

      const { price: coursePrice, title: courseTitle } = courseResult.rows[0];

      // Check user balance
      const userQuery = `
        SELECT wallet_balance
        FROM users
        WHERE id = $1;
      `;
      const userResult = await client.query(userQuery, [userId]);
      if (!userResult.rows.length) {
        throw new NotFoundException('User not found');
      }

      const walletBalance = userResult.rows[0].wallet_balance;
      if (walletBalance < coursePrice) {
        throw new BadRequestException('User has not enough balance');
      }

      // Update user balance
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
        [coursePrice, userId],
      );

      // Record wallet transaction
      await client.query(
        'INSERT INTO wallet_transactions (user_id, amount, description, type) VALUES ($1, $2, $3, $4)',
        [userId, coursePrice, `Buy course ${courseTitle}`, 'withdraw'],
      );

      // Enroll user in course
      await client.query(
        'INSERT INTO user_courses (user_id, course_id) VALUES ($1, $2)',
        [userId, courseId],
      );
    });
  }

  async findUserCourses(userId: number): Promise<Course[]> {
    const query = `
        SELECT 
            c.id,
            c.title,
            s.name AS specialty_name,
            i.name As instractor_name,
            c.poster,
            COUNT(v.id) AS total_videos,
            COALESCE(COUNT(cv.video_id), 0) AS completed_videos,
            ROUND(
                COALESCE(
                    (COUNT(cv.video_id)::FLOAT / NULLIF(COUNT(v.id), 0)) * 100,
                    0
                )
            ) AS completion_percentage,
            TO_CHAR(uc.enrolled_at, 'YYYY-MM-DD') AS enrolled_date,
            TO_CHAR(MAX(cv.completed_at), 'YYYY-MM-DD') AS last_watched
        FROM 
            courses c
            JOIN user_courses uc ON c.id = uc.course_id
            JOIN specialties s ON c.specialty_id = s.id
            LEFT JOIN chapters ch ON c.id = ch.course_id
            LEFT JOIN instructors i ON c.instructor_id = i.id
            LEFT JOIN videos v ON ch.id = v.chapter_id
            LEFT JOIN completed_videos cv ON v.id = cv.video_id AND cv.user_id = uc.user_id
        WHERE 
            uc.user_id = $1
        GROUP BY 
            c.id, c.title, s.name, i.name, c.poster, uc.enrolled_at
        ORDER BY 
            c.id;
    `;
    return await this.dbService.query(query, [userId]);
  }

  async isUserEnrolled(userId: number, courseId: number): Promise<boolean> {
    const query = `
      SELECT 1
      FROM user_courses
      WHERE user_id = $1 AND course_id = $2;
    `;
    const result = await this.dbService.query(query, [userId, courseId]);
    return result.length > 0;
  }
}
