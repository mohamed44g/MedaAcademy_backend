import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dtos/create-course-dto';
import { UpdateCourseDto } from './dtos/update-course-dto';
import { Public } from '../decorators/routes.decorator';
import { Roles } from '../decorators/user.role.decoratros';
import { Role, CustomRequest, IPayload } from '../utils/types';
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
import { extname } from 'path';
import { userPayload } from 'src/decorators/user.decorators';
import { CoursesGuard } from 'src/guards/courses.guards';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private courseService: CourseService) {}

  @Public()
  @UseGuards(CoursesGuard)
  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: true, default: 1 })
  @ApiQuery({ name: 'limit', required: true, default: 6 })
  async findAllCourses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
    @userPayload() userData: IPayload,
  ) {
    const id = userData ? userData.id : 0;
    const courses = await this.courseService.findAllCourses(page, limit, id);
    return response('Courses retrieved successfully', courses);
  }

  @Public()
  @UseGuards(CoursesGuard)
  @Get('latest')
  @ApiOperation({ summary: 'Get latest courses' })
  @ApiResponse({
    status: 200,
    description: 'Latest courses retrieved successfully',
  })
  async getLatestCourses(@userPayload() userData: IPayload) {
    const id = userData ? userData.id : 0;
    const courses = await this.courseService.getLatestCourses(id);
    return response('Latest courses retrieved successfully', courses);
  }

  @Get('/enrolled-courses')
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get enrolled courses' })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
  })
  @ApiBearerAuth()
  async findUserCourses(@userPayload() userData: IPayload) {
    const courses = await this.courseService.findUserCourses(userData.id);
    return response('Enrolled courses retrieved successfully', courses);
  }

  @Public()
  @UseGuards(CoursesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({
    status: 200,
    description: 'Course found',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async findCourseById(
    @Param('id', ParseIntPipe) id: number,
    @userPayload() userData: IPayload,
  ) {
    const isEnrolled = userData?.id
      ? await this.courseService.isUserEnrolled(userData?.id, id)
      : false;
    const course = await this.courseService.findCourseById(id);
    return response('Course retrieved successfully', {
      course,
      isEnrolled,
    });
  }

  @Public()
  @UseGuards(CoursesGuard)
  @Get('instructor/:instructorId')
  @ApiOperation({ summary: 'Get courses by instructor ID with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Instructor not found' })
  async getCoursesByInstructorId(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @userPayload() userData: IPayload,
  ) {
    const id = userData ? userData.id : 0;
    const limit = 6;
    const result = await this.courseService.getCoursesByInstructorId(
      instructorId,
      page,
      limit,
      id,
    );
    return response('Courses retrieved successfully', result);
  }

  @Roles(Role.user, Role.admin, Role.super_admin)
  @Get(':id/content')
  @ApiOperation({ summary: 'Get course content' })
  @ApiResponse({
    status: 200,
    description: 'Course content retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiBearerAuth()
  async findCourseContent(
    @Param('id', ParseIntPipe) id: number,
    @userPayload() userData: IPayload,
  ) {
    const courseContent = await this.courseService.findCourseContent(
      id,
      userData.id,
    );
    return response('Course content retrieved successfully', courseContent);
  }

  @Post(':courseId/enroll')
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiResponse({
    status: 201,
    description: 'Successfully enrolled',
  })
  @ApiResponse({
    status: 400,
    description: 'Already enrolled or invalid course',
  })
  @ApiBearerAuth()
  async enroll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @userPayload() userData: IPayload,
  ) {
    console.log('courseId', courseId);
    await this.courseService.enrollUser(userData.id, courseId);
    return response('Successfully enrolled in course', null);
  }

  @Public()
  @Get('/courses/:id/enrollment/:userId')
  @ApiOperation({ summary: 'Check enrollment status' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiBearerAuth()
  async checkEnrollment(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const isEnrolled = await this.courseService.isUserEnrolled(userId, id);
    return response('Enrollment status retrieved successfully', isEnrolled);
  }
}

@ApiTags('Admin')
@Controller('admin/courses')
export class AdminCourseController {
  constructor(private courseService: CourseService) {}

  @Post()
  @Roles(Role.admin, Role.super_admin)
  @UseInterceptors(
    FileInterceptor('poster', {
      storage: diskStorage({
        destination: './uploads/posters',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `course-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException(
              'Only JPG, JPEG, and PNG files are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  @ApiOperation({
    summary:
      'Create a new course with optional poster image (JPG, JPEG, PNG, max 5MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'title',
        'description',
        'price',
        'specialty_id',
        'poster',
        'instractor_id',
      ],
      properties: {
        title: { type: 'string', example: 'Introduction to Cardiology' },
        description: {
          type: 'string',
          example: 'Learn the basics of cardiology.',
        },
        price: { type: 'number', example: 200 },
        specialty_id: { type: 'integer', example: 12 },
        poster: { type: 'string', format: 'binary' },
        instractor_id: {
          type: 'integer',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or file type',
  })
  @ApiBearerAuth()
  async createCourse(
    @Body() dto: CreateCourseDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const posterPath = `/uploads/posters/${file.filename}`;
    const course = await this.courseService.createCourse(dto, posterPath);
    return response('Course created successfully', course);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.super_admin)
  @UseInterceptors(
    FileInterceptor('poster', {
      storage: diskStorage({
        destination: './uploads/posters',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `course-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException(
              'Only JPG, JPEG, and PNG files are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  @ApiOperation({
    summary:
      'Update a course with optional poster image (JPG, JPEG, PNG, max 5MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Advanced Cardiology' },
        description: {
          type: 'string',
          example: 'Advanced topics in cardiology.',
        },
        price: { type: 'number', example: 149.99 },
        specialty_id: { type: 'integer', example: 1 },
        poster: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiBearerAuth()
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const posterPath = `/uploads/posters/${file.filename}`;
    const course = await this.courseService.updateCourse(id, dto, posterPath);
    return response('Course updated successfully', course);
  }

  @Delete(':id')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({
    status: 200,
    description: 'Course deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiBearerAuth()
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    await this.courseService.deleteCourse(id);
    return response('Course deleted successfully', null);
  }
}
