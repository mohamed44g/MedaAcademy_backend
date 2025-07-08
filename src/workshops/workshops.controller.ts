import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { WorkshopService } from './workshops.service';
import { CreateWorkshopDto } from './dtos/create-workshop-dto';
import { UpdateWorkshopDto } from './dtos/update-workshop-dto';
import { Roles } from '../decorators/user.role.decoratros';
import { IPayload, Role } from '../utils/types';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { userPayload } from 'src/decorators/user.decorators';
import { Public } from 'src/decorators/routes.decorator';

@ApiTags('Workshops')
@Controller('workshops')
export class WorkshopController {
  constructor(private workshopService: WorkshopService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all workshops' })
  @ApiResponse({ status: 200, description: 'Workshops retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workshops not found' })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'limit', required: true, type: Number })
  async findAllWorkshops(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
  ) {
    const workshops = await this.workshopService.findAllWorkshops(page, limit);
    return response('Workshops retrieved successfully', workshops);
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Get latest workshops' })
  @ApiResponse({
    status: 200,
    description: 'Latest workshops retrieved successfully',
  })
  async getLatestWorkshops() {
    const workshops = await this.workshopService.getLatestWorkshops();
    return response('Latest workshops retrieved successfully', workshops);
  }

  @Post()
  @Roles(Role.admin, Role.super_admin)
  @UseInterceptors(
    FileInterceptor('image_url', {
      storage: diskStorage({
        destination: './Uploads/workshops',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Create a new workshop' })
  @ApiResponse({ status: 201, description: 'Workshop created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'title',
        'description',
        'price',
        'event_date',
        'event_time',
        'image_url',
      ],
      properties: {
        title: { type: 'string', example: 'Introduction to Cardiology' },
        description: {
          type: 'string',
          example: 'Learn the basics of cardiology.',
        },
        price: { type: 'number', example: 200 },
        event_date: {
          type: 'string',
          format: 'date',
          example: '2025-06-28',
        },
        event_time: { type: 'string', example: '10' },
        image_url: { type: 'string', format: 'binary' },
      },
    },
  })
  async createWorkshop(
    @Body() dto: CreateWorkshopDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(dto);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const posterPath = `/uploads/workshops/${file.filename}`;
    const workshop = await this.workshopService.createWorkshop(dto, posterPath);
    return response('Workshop created successfully', workshop);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.super_admin)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './Uploads/workshops',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Update a workshop' })
  @ApiResponse({ status: 200, description: 'Workshop updated successfully' })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  @ApiBearerAuth()
  async updateWorkshop(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkshopDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      dto.image_url = `/Uploads/workshops/${file.filename}`;
    }
    const workshop = await this.workshopService.updateWorkshop(id, dto);
    return response('Workshop updated successfully', workshop);
  }

  @Delete(':id')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete a workshop' })
  @ApiResponse({ status: 200, description: 'Workshop deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  @ApiBearerAuth()
  async deleteWorkshop(@Param('id', ParseIntPipe) id: number) {
    await this.workshopService.deleteWorkshop(id);
    return response('Workshop deleted successfully', null);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Register user for a workshop' })
  @ApiResponse({ status: 200, description: 'User registered successfully' })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  @ApiResponse({ status: 400, description: 'Invalid or banned user' })
  @ApiBearerAuth()
  async registerUserForWorkshop(
    @Param('id', ParseIntPipe) workshopId: number,
    @userPayload() user: IPayload,
  ) {
    await this.workshopService.registerUserForWorkshop(user.id, workshopId);
    return response('User registered successfully', null);
  }

  @Get(':id/registrations')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get registered users for a workshop' })
  @ApiResponse({
    status: 200,
    description: 'Registered users retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  @ApiBearerAuth()
  async findRegistrationsByWorkshopId(
    @Param('id', ParseIntPipe) workshopId: number,
  ) {
    const registrations =
      await this.workshopService.findRegistrationsByWorkshopId(workshopId);
    return response('Registered users retrieved successfully', registrations);
  }

  @Roles(Role.admin, Role.super_admin, Role.user)
  @Get('/registrations')
  @ApiOperation({ summary: 'Get user’s registered workshops' })
  @ApiResponse({
    status: 200,
    description: 'User’s registered workshops retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or banned user' })
  @ApiBearerAuth()
  async findUserRegistrations(@userPayload() user: IPayload) {
    const workshops = await this.workshopService.findUserRegistrations(user.id);
    return response(
      'User’s registered workshops retrieved successfully',
      workshops,
    );
  }
}
