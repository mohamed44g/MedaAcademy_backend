import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../decorators/user.role.decoratros';
import { Role } from '../utils/types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { response } from '../utils/response';

class UpdateUserRoleDto {
  role: 'user' | 'admin' | 'super_admin';
}

class UpdateUserStatusDto {
  status: 'active' | 'banned';
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  @ApiBearerAuth()
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return response('Dashboard statistics retrieved successfully', stats);
  }

  @Get('users')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiBearerAuth()
  async getAllUsers() {
    const users = await this.adminService.getAllUsers();
    return response('Users retrieved successfully', users);
  }

  @Patch('users/:id/role')
  @Roles(Role.super_admin)
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const user = await this.adminService.updateUserRole(id, dto.role);
    return response('User role updated successfully', user);
  }

  @Patch('users/:id/status')
  @Roles(Role.super_admin)
  @ApiOperation({ summary: 'Update user status (active/banned)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const user = await this.adminService.updateUserStatus(id, dto.status);
    return response('User status updated successfully', user);
  }

  @Delete('courses/:id')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiBearerAuth()
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteCourse(id);
    return response('Course deleted successfully', null);
  }

  @Delete('comments/:id')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiBearerAuth()
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteComment(id);
    return response('Comment deleted successfully', null);
  }

  @Get('popular-courses')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get most popular courses' })
  @ApiResponse({
    status: 200,
    description: 'Popular courses retrieved successfully',
  })
  @ApiBearerAuth()
  async getPopularCourses() {
    const courses = await this.adminService.getPopularCourses();
    return response('Popular courses retrieved successfully', courses);
  }

  @Get('popular-videos')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get most popular videos' })
  @ApiResponse({
    status: 200,
    description: 'Popular videos retrieved successfully',
  })
  @ApiBearerAuth()
  async getPopularVideos() {
    const videos = await this.adminService.getPopularVideos();
    return response('Popular videos retrieved successfully', videos);
  }

  @Get('course-completion-rates')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get course completion rates' })
  @ApiResponse({
    status: 200,
    description: 'Course completion rates retrieved successfully',
  })
  @ApiBearerAuth()
  async getCourseCompletionRates() {
    const rates = await this.adminService.getCourseCompletionRates();
    return response('Course completion rates retrieved successfully', rates);
  }

  @Get('pending-comments')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get pending comments for approval' })
  @ApiResponse({
    status: 200,
    description: 'Pending comments retrieved successfully',
  })
  @ApiBearerAuth()
  async getPendingComments() {
    const comments = await this.adminService.getPendingComments();
    return response('Pending comments retrieved successfully', comments);
  }

  @Delete('workshops/:id')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete a workshop' })
  @ApiResponse({ status: 200, description: 'Workshop deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  @ApiBearerAuth()
  async deleteWorkshop(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteWorkshop(id);
    return response('Workshop deleted successfully', null);
  }
}
