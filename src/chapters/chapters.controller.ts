import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ChapterService } from './chapters.service';
import { CreateChapterDto } from './dtos/create-chapter-dto';
import { UpdateChapterDto } from './dtos/update-chapter-dto';
import { Public } from '../decorators/routes.decorator';
import { Roles } from '../decorators/user.role.decoratros';
import { Role } from '../utils/types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { response } from '../utils/response';

@ApiTags('Chapters')
@Controller('/chapters')
export class ChapterController {
  constructor(private chapterService: ChapterService) {}

  @Post(':courseId')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Create a new chapter for a course' })
  @ApiResponse({
    status: 201,
    description: 'Chapter created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async createChapter(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateChapterDto,
  ) {
    dto.course_id = courseId;
    const chapter = await this.chapterService.createChapter(dto);
    return response('Chapter created successfully', chapter);
  }

  @Public()
  @Get(':courseId')
  @ApiOperation({ summary: 'Get all chapters for a course' })
  @ApiResponse({
    status: 200,
    description: 'Chapters retrieved successfully',
  })
  async findChaptersByCourseId(
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    const chapters = await this.chapterService.findChaptersByCourseId(courseId);
    return response('Chapters retrieved successfully', chapters);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get chapter by ID' })
  @ApiResponse({ status: 200, description: 'Chapter found' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async findChapterById(@Param('id', ParseIntPipe) id: number) {
    const chapter = await this.chapterService.findChapterById(id);
    return response('Chapter retrieved successfully', chapter);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Update a chapter' })
  @ApiResponse({
    status: 200,
    description: 'Chapter updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @ApiBearerAuth()
  async updateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChapterDto,
  ) {
    const chapter = await this.chapterService.updateChapter(id, dto);
    return response('Chapter updated successfully', chapter);
  }

  @Delete(':id')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete a chapter' })
  @ApiResponse({ status: 200, description: 'Chapter deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  @ApiBearerAuth()
  async deleteChapter(@Param('id', ParseIntPipe) id: number) {
    await this.chapterService.deleteChapter(id);
    return response('Chapter deleted successfully', null);
  }
}
