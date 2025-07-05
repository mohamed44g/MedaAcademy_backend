import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdminModel, DashboardStats } from './admin.model';
import { UserService } from '../users/users.service';
import { CourseService } from '../courses/course.service';
import { CommentService } from '../comments/comments.service';
import { WorkshopService } from '../workshops/workshops.service';
import { Comment } from '../comments/comments.model';
import { User } from 'src/users/users.model';

@Injectable()
export class AdminService {
  constructor(
    private adminModel: AdminModel,
    private userService: UserService,
    private courseService: CourseService,
    private commentService: CommentService,
    private workshopService: WorkshopService,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    return this.adminModel.getDashboardStats();
  }

  async getPopularCourses(limit: number = 5): Promise<any[]> {
    return this.adminModel.getPopularCourses(limit);
  }

  async getPopularVideos(limit: number = 5): Promise<any[]> {
    return this.adminModel.getPopularVideos(limit);
  }

  async getCourseCompletionRates(): Promise<any[]> {
    return this.adminModel.getCourseCompletionRates();
  }

  async getPendingComments(): Promise<Comment[]> {
    return this.adminModel.getPendingComments();
  }

  async updateUserRole(id: number, role: any): Promise<any> {
    return this.userService.updateUserRole(id, role);
  }

  async updateUserStatus(
    id: number,
    status: 'active' | 'banned',
  ): Promise<any> {
    if (!['active', 'banned'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const result = await this.userService.updateUserStatus(id, status);
    return result;
  }

  async deleteCourse(id: number): Promise<void> {
    const course = await this.courseService.findCourseById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    await this.courseService.deleteCourse(id);
  }

  async deleteComment(id: number): Promise<void> {
    await this.commentService.deleteComment(id, 0);
  }


  async deleteWorkshop(id: number): Promise<void> {
    await this.workshopService.deleteWorkshop(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userService.findAllUsers();
  }
}
