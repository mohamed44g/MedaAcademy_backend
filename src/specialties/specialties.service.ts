import { Injectable } from '@nestjs/common';
import { SpecialtiesModel } from './specialties.model';
import { Specialties } from 'src/utils/types';
import { CreateSpecialtieDto } from './dtos/create-specialty-dto';

@Injectable()
export class SpecialtiesService {
  constructor(private specialtiesModel: SpecialtiesModel) {}

  async getAllSpecialties(): Promise<Specialties[]> {
    return this.specialtiesModel.getAllSpecialties();
  }

  async createSpecialty(dto: CreateSpecialtieDto): Promise<Specialties> {
    return this.specialtiesModel.createSpecialty(dto);
  }
}
