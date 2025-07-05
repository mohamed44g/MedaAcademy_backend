import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CourseModel,
  Course,
  CourseOverview,
  CourseContent,
} from './course.model';
import { CreateCourseDto } from './dtos/create-course-dto';
import { UpdateCourseDto } from './dtos/update-course-dto';

@Injectable()
export class CourseService {
  constructor(private courseModel: CourseModel) {}

  async createCourse(
    dto: CreateCourseDto,
    posterPath: string,
  ): Promise<Course> {
    // Validate specialty_id
    const specialtyExists = await this.courseModel.validateSpecialtyId(
      dto.specialty_id,
    );
    if (!specialtyExists) {
      throw new BadRequestException('القسم مش موجود اختار قسم موجود.');
    }
    return this.courseModel.createCourse({ ...dto, poster: posterPath });
  }

  async findAllCourses(
    page: number,
    limit: number,
  ): Promise<{ data: Course[]; total: number }> {
    return this.courseModel.findAllCourses(page, limit);
  }

  async getLatestCourses(): Promise<any> {
    return this.courseModel.getLatestCourses();
  }

  async findCourseById(id: number): Promise<CourseOverview> {
    const course = await this.courseModel.findCourseById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async getCoursesByInstructorId(
    instructorId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    return this.courseModel.getCoursesByInstructorId(instructorId, page, limit);
  }

  async findCourseContent(
    courseId: number,
    userId: number,
  ): Promise<CourseContent> {
    const checkEnrollment = await this.courseModel.isUserEnrolled(
      userId,
      courseId,
    );
    if (!checkEnrollment) {
      throw new BadRequestException('User is not enrolled in this course');
    }
    return this.courseModel.getCourseContent(courseId, userId);
  }

  async updateCourse(
    id: number,
    dto: UpdateCourseDto,
    posterPath?: string,
  ): Promise<Course> {
    if (dto.specialty_id) {
      const specialtyExists = await this.courseModel.validateSpecialtyId(
        dto.specialty_id,
      );
      if (!specialtyExists) {
        throw new BadRequestException('Invalid specialty ID');
      }
    }

    const updates = { ...dto };
    if (posterPath) {
      updates.poster = posterPath;
    }

    const course = await this.courseModel.updateCourse(id, updates);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async deleteCourse(id: number): Promise<void> {
    const course = await this.courseModel.findCourseById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    await this.courseModel.deleteCourse(id);
  }

  async enrollUser(userId: number, courseId: number): Promise<void> {
    await this.courseModel.enrollUser(userId, courseId);
  }

  async findUserCourses(userId: number): Promise<Course[]> {
    return this.courseModel.findUserCourses(userId);
  }

  async isUserEnrolled(userId: number, courseId: number): Promise<boolean> {
    return this.courseModel.isUserEnrolled(userId, courseId);
  }
}
