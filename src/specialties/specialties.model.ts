import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Specialties } from 'src/utils/types';
import { CreateSpecialtieDto } from './dtos/create-specialty-dto';

@Injectable()
export class SpecialtiesModel {
  constructor(private dbService: DatabaseService) {}

  async getAllSpecialties(): Promise<Specialties[]> {
    const query = 'SELECT * FROM specialties;';
    const result = await this.dbService.query(query);
    return result;
  }

  async createSpecialty(dto: CreateSpecialtieDto): Promise<Specialties> {
    const query = `
      INSERT INTO specialties (name)
      VALUES ($1)
      RETURNING *;
    `;
    const values = [dto.name];
    const result = await this.dbService.query(query, values);
    return result[0];
  }
}
