import { Body, Controller, Get, Post } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';
import { Roles } from 'src/decorators/user.role.decoratros';
import { Role, Specialties } from 'src/utils/types';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateSpecialtieDto } from './dtos/create-specialty-dto';
import { response } from 'src/utils/response';
import { Public } from 'src/decorators/routes.decorator';

@Controller('specialties')
export class SpecialtiesController {
  constructor(private specialtiesService: SpecialtiesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all specialties' })
  @ApiResponse({
    status: 200,
    description: 'Specialties found',
    type: [Object],
  })
  @ApiResponse({ status: 404, description: 'Specialties not found' })
  @ApiBearerAuth()
  async getAllSpecialties(): Promise<any> {
    const specialties = await this.specialtiesService.getAllSpecialties();
    return response('Specialties fetched successfully', specialties);
  }

  @Post()
  @Roles(Role.super_admin, Role.admin)
  @ApiOperation({ summary: 'Create a new specialty' })
  @ApiResponse({ status: 201, description: 'Specialty created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async createSpecialty(@Body() dto: CreateSpecialtieDto): Promise<any> {
    const specialties = await this.specialtiesService.createSpecialty(dto);
    return response('Specialty created successfully', specialties);
  }
}
