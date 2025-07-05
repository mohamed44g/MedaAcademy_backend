import { Injectable, BadRequestException } from '@nestjs/common';
import { InstructorsModel } from './instructors.model';
import { CreateInstructorDto } from './dto/create-instractor';
import { UpdateInstructorDto } from './dto/update-Instructor-dto';

@Injectable()
export class InstructorsService {
  constructor(private readonly instructorsModel: InstructorsModel) {}

  async getAllInstructors(): Promise<any> {
    return await this.instructorsModel.getAllInstructors();
  }
  async createInstructor(
    instructor: CreateInstructorDto,
    avatarPath?: string,
  ): Promise<any> {
    if (!instructor.name || !instructor.specialization) {
      throw new BadRequestException('Name and specialization are required');
    }
    return await this.instructorsModel.createInstructor(instructor, avatarPath);
  }

  async getInstructorById(instructorId: number): Promise<any> {
    return await this.instructorsModel.getInstructorById(instructorId);
  }

  async updateInstructor(
    instructorId: number,
    instructor: UpdateInstructorDto,
  ): Promise<any> {
    return await this.instructorsModel.updateInstructor(instructorId, instructor);
  }
}
