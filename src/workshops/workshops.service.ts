import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WorkshopModel, Workshop } from './workshops.model';
import { CreateWorkshopDto } from './dtos/create-workshop-dto';
import { UpdateWorkshopDto } from './dtos/update-workshop-dto';

@Injectable()
export class WorkshopService {
  constructor(private workshopModel: WorkshopModel) {}

  async createWorkshop(
    dto: CreateWorkshopDto,
    posterPath: string,
  ): Promise<Workshop> {
    return this.workshopModel.createWorkshop(dto, posterPath);
  }

  async findAllWorkshops(page: number, limit: number): Promise<{ data: Workshop[]; total: number }> {
    return this.workshopModel.findAllWorkshops(page, limit);
  }

  async getLatestWorkshops(): Promise<Workshop[]> {
    return this.workshopModel.getLatestWorkshops();
  }

  async findWorkshopById(id: number): Promise<Workshop> {
    const workshop = await this.workshopModel.findWorkshopById(id);
    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }
    return workshop;
  }

  async updateWorkshop(
    id: number,
    dto: UpdateWorkshopDto,
  ): Promise<Workshop | null> {
    const workshop = await this.workshopModel.findWorkshopById(id);
    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }
    const updatedWorkshop = await this.workshopModel.updateWorkshop(id, dto);
    return updatedWorkshop;
  }

  async deleteWorkshop(id: number): Promise<void> {
    const workshop = await this.workshopModel.findWorkshopById(id);
    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }
    await this.workshopModel.deleteWorkshop(id);
  }

  async registerUserForWorkshop(
    userId: number,
    workshopId: number,
  ): Promise<void> {
    const workshopExists =
      await this.workshopModel.validateWorkshopId(workshopId);
    if (!workshopExists) {
      throw new NotFoundException('Workshop not found');
    }
    const userExists = await this.workshopModel.validateUserId(userId);
    if (!userExists) {
      throw new BadRequestException('Invalid or banned user');
    }
    await this.workshopModel.registerUserForWorkshop(userId, workshopId);
  }

  async findRegistrationsByWorkshopId(workshopId: number): Promise<any[]> {
    const workshopExists =
      await this.workshopModel.validateWorkshopId(workshopId);
    if (!workshopExists) {
      throw new NotFoundException('Workshop not found');
    }
    return this.workshopModel.findRegistrationsByWorkshopId(workshopId);
  }

  async findUserRegistrations(userId: number): Promise<Workshop[]> {
    const userExists = await this.workshopModel.validateUserId(userId);
    if (!userExists) {
      throw new BadRequestException('Invalid or banned user');
    }
    return this.workshopModel.findUserRegistrations(userId);
  }
}
