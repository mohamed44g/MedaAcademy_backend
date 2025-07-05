import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ChapterModel, Chapter } from './chapters.model';
import { CreateChapterDto } from './dtos/create-chapter-dto';
import { UpdateChapterDto } from './dtos/update-chapter-dto';

@Injectable()
export class ChapterService {
  constructor(private chapterModel: ChapterModel) {}

  async createChapter(dto: CreateChapterDto): Promise<Chapter> {
    const courseExists = await this.chapterModel.validateCourseId(
      dto.course_id,
    );
    if (!courseExists) {
      throw new BadRequestException('Invalid course ID');
    }

    return this.chapterModel.createChapter(dto);
  }

  async findChaptersByCourseId(courseId: number): Promise<Chapter[]> {
    const courseExists = await this.chapterModel.validateCourseId(courseId);
    if (!courseExists) {
      throw new NotFoundException('Course not found');
    }
    return this.chapterModel.findChaptersByCourseId(courseId);
  }

  async findChapterById(id: number): Promise<Chapter> {
    const chapter = await this.chapterModel.findChapterById(id);
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  async updateChapter(id: number, dto: UpdateChapterDto): Promise<Chapter> {
    if (dto.course_id) {
      const courseExists = await this.chapterModel.validateCourseId(
        dto.course_id,
      );
      if (!courseExists) {
        throw new BadRequestException('Invalid course ID');
      }
    }

    const chapter = await this.chapterModel.updateChapter(id, dto);
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  async deleteChapter(id: number): Promise<void> {
    const chapter = await this.chapterModel.findChapterById(id);
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    await this.chapterModel.deleteChapter(id);
  }
}
