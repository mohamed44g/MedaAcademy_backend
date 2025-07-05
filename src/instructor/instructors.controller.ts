import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InstructorsService } from './instructors.service';
import { response } from '../utils/response';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateInstructorDto } from './dto/create-instractor';
import { Roles } from 'src/decorators/user.role.decoratros';
import { Role } from 'src/utils/types';
import { Public } from 'src/decorators/routes.decorator';
import { UpdateInstructorDto } from './dto/update-Instructor-dto';

@ApiTags('instructors')
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all instructors' })
  @ApiResponse({
    status: 200,
    description: 'Instructors retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Instructors not found' })
  async getAllInstructors() {
    const instructors = await this.instructorsService.getAllInstructors();
    return response('Instructors retrieved successfully', instructors);
  }

  @Post()
  @Roles(Role.admin, Role.super_admin)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/instructors',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `instructor-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only image files are allowed (.jpg, .jpeg, .png, .gif)',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Create a new instructor with optional avatar upload',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'dr. Aysam Alia' },
        specialization: {
          type: 'string',
          example: 'NNU Medical Student | Researcher',
        },
        bio: { type: 'string', example: 'أستاذ مساعد في كلية الطب...' },
        avatar: { type: 'string', format: 'binary' },
      },
      required: ['name', 'specialization'],
    },
  })
  @ApiResponse({ status: 201, description: 'Instructor created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or file type' })
  @ApiBearerAuth()
  async createInstructor(
    @Body() instructor: CreateInstructorDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarPath = file
      ? `/uploads/instructors/${file.filename}`
      : undefined;
    const newInstructor = await this.instructorsService.createInstructor(
      instructor,
      avatarPath,
    );
    return response('Instructor created successfully', newInstructor);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get instructor by ID' })
  @ApiResponse({
    status: 200,
    description: 'Instructor retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Instructor not found' })
  async getInstructorById(@Param('id', ParseIntPipe) id: number) {
    const instructor = await this.instructorsService.getInstructorById(id);
    return response('Instructor retrieved successfully', instructor);
  }

  @Roles(Role.admin, Role.super_admin)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/instructors',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `instructor-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only image files are allowed (.jpg, .jpeg, .png, .gif)',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Update instructor by ID' })
  @ApiResponse({ status: 200, description: 'Instructor updated successfully' })
  @ApiResponse({ status: 404, description: 'Instructor not found' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'dr. Aysam Alia' },
        specialization: {
          type: 'string',
          example: 'NNU Medical Student | Researcher',
        },
        bio: { type: 'string', example: 'أستاذ مساعد في كلية الطب...' },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBearerAuth()
  async updateInstructor(
    @Param('id', ParseIntPipe) id: number,
    @Body() instructor: UpdateInstructorDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarPath = file
      ? `/uploads/instructors/${file.filename}`
      : undefined;
    if (avatarPath) {
      instructor.avatar = avatarPath;
    }
    const updatedInstructor = await this.instructorsService.updateInstructor(
      id,
      instructor,
    );
    return response('Instructor updated successfully', updatedInstructor);
  }
}
