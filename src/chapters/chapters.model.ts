import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Chapter {
  id?: number;
  course_id: number;
  title: string;
  type: 'midterm' | 'final';
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class ChapterModel {
  constructor(private dbService: DatabaseService) {}

  async createChapter(
    chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Chapter> {
    const query = `
      INSERT INTO chapters (course_id, title, type)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [chapter.course_id, chapter.title, chapter.type];
    const result = await this.dbService.query(query, values);
    return result[0];
  }

  async findChaptersByCourseId(courseId: number): Promise<Chapter[]> {
    const query = 'SELECT * FROM chapters WHERE course_id = $1;';
    return await this.dbService.query(query, [courseId]);
  }

  async findChapterById(id: number): Promise<Chapter | null> {
    const query = 'SELECT * FROM chapters WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result[0] || null;
  }

  async updateChapter(
    id: number,
    updates: Partial<Chapter>,
  ): Promise<Chapter | null> {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = Object.values(updates);
    const query = `
      UPDATE chapters
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length + 1}
      RETURNING *;
    `;
    const result = await this.dbService.query(query, [...values, id]);
    return result[0] || null;
  }

  async deleteChapter(id: number): Promise<void> {
    const query = 'DELETE FROM chapters WHERE id = $1;';
    await this.dbService.query(query, [id]);
  }

  async validateCourseId(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM courses WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result.length > 0;
  }
}
