import { Module } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { SpecialtiesController } from './specialties.controller';
import { SpecialtiesService } from './specialties.service';
import { SpecialtiesModel } from './specialties.model';

@Module({
  imports: [],
  controllers: [SpecialtiesController],
  providers: [DatabaseService, SpecialtiesService, SpecialtiesModel],
  exports: [],
})
export class SpecialtiesModule {}
