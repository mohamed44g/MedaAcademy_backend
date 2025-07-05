import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateInstructorDto } from './dto/update-Instructor-dto';

export interface Instructor {
  name: string;
  specialization: string;
  bio?: string;
}

export interface InstructorOverview {
  id: number;
  name: string;
  specialization: string;
  avatar: string | null;
  bio: string | null;
  stats: {
    totalCourses: number;
    totalStudents: number;
    totalHours: number;
  };
}

@Injectable()
export class InstructorsModel {
  constructor(private readonly dbService: DatabaseService) {}

  //get all instructors
  async getAllInstructors(): Promise<InstructorOverview[]> {
    const query = `SELECT * FROM instructors ORDER BY id`;
    const result = await this.dbService.query(query);
    return result;
  }

  async createInstructor(
    instructor: Instructor,
    avatarPath?: string,
  ): Promise<InstructorOverview> {
    const query = `
      INSERT INTO instructors (name, specialization, avatar, bio)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, specialization, avatar, bio, created_at
    `;
    const values = [
      instructor.name,
      instructor.specialization,
      avatarPath || null,
      instructor.bio || null,
    ];
    const result = await this.dbService.query(query, values);
    const newInstructor = result[0];

    return {
      id: newInstructor.id,
      name: newInstructor.name,
      specialization: newInstructor.specialization,
      avatar: newInstructor.avatar,
      bio: newInstructor.bio,
      stats: {
        totalCourses: 0,
        totalStudents: 0,
        totalHours: 0,
      },
    };
  }

  async getInstructorById(instructorId: number): Promise<InstructorOverview> {
    const query = `
      SELECT 
        i.id,
        i.name,
        i.specialization,
        i.avatar,
        i.bio,
        COALESCE(COUNT(DISTINCT c.id), 0) as total_courses,
        COALESCE(COUNT(DISTINCT uc.user_id), 0) as total_students,
        COALESCE(SUM(v.duration) / 3600, 0) as total_hours
      FROM instructors i
      LEFT JOIN courses c ON i.id = c.instructor_id
      LEFT JOIN user_courses uc ON c.id = uc.course_id
      LEFT JOIN chapters ch ON c.id = ch.course_id
      LEFT JOIN videos v ON ch.id = v.chapter_id
      WHERE i.id = $1
      GROUP BY i.id, i.name, i.specialization, i.avatar, i.bio
    `;
    const result = await this.dbService.query(query, [instructorId]);
    if (!result.length) {
      throw new NotFoundException('Instructor not found');
    }
    const instructor = result[0];
    return {
      id: instructor.id,
      name: instructor.name,
      specialization: instructor.specialization,
      avatar: instructor.avatar,
      bio: instructor.bio,
      stats: {
        totalCourses: parseInt(instructor.total_courses, 10),
        totalStudents: parseInt(instructor.total_students, 10),
        totalHours: Math.round(parseFloat(instructor.total_hours)),
      },
    };
  }

  async updateInstructor(
    instructorId: number,
    instructor: UpdateInstructorDto,
  ) {
    //enhance update query performance
    const updateFields = Object.keys(instructor)
      .filter((key) => instructor[key] !== '')
      .map((key, index) => `${key} = $${index + 1}`);
    const query = `
      UPDATE instructors
      SET ${updateFields.join(', ')}
      WHERE id = $${updateFields.length + 1}
      RETURNING *;
    `;

    //remove empty values
    const values = Object.values(instructor)
      .filter((value) => value !== '')
      .concat(instructorId);
    const result = await this.dbService.query(query, values);
    const updatedInstructor = result[0];
    return {
      id: updatedInstructor.id,
      name: updatedInstructor.name,
      specialization: updatedInstructor.specialization,
      avatar: updatedInstructor.avatar,
      bio: updatedInstructor.bio,
    };
  }
}
