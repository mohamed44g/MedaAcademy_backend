import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Request,
  Query,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dtos/create-user-dto';
import { UpdateUserDto } from './dtos/update-user-dto';
import { LoginDto } from './dtos/login-user-dto';
import { Public } from '../decorators/routes.decorator';
import { Roles } from '../decorators/user.role.decoratros';
import { Role, CustomRequest, IPayload } from '../utils/types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { User } from './users.model';
import { userPayload } from 'src/decorators/user.decorators';
import { response } from 'src/utils/response';
import { DepositUserWalletBalanceDto } from './dtos/user-deposit-dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async register(@Body() dto: CreateUserDto) {
    const user = await this.userService.register(dto);
    return response('User registered successfully', user);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: Object })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Request() req: CustomRequest) {
    const deviceToken = req.headers?.['device-token'] || 'unknown-device';
    const user = await this.userService.login(dto, deviceToken as string);
    return response('User logged in successfully', user);
  }

  //deposit user wallet balanace by super admin
  @Roles(Role.super_admin, Role.admin)
  @Post('deposit/:userId')
  @ApiOperation({ summary: 'Deposit user wallet balance' })
  @ApiResponse({ status: 200, description: 'Deposit successful', type: Object })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async depositUserWalletBalance(
    @Param('userId', ParseIntPipe) userIdToDeposit: number,
    @Body() dto: DepositUserWalletBalanceDto,
  ) {
    const user = await this.userService.depositUserWalletBalance(
      userIdToDeposit,
      dto,
    );
    return response('User wallet balance deposited successfully', user);
  }

  //get user wallet balance by user
  @Roles(Role.user, Role.admin, Role.super_admin)
  @Get('/wallet')
  @ApiOperation({ summary: 'Get user wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'User wallet balance retrieved',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  async getUserWalletBalance(
    @userPayload() userData: IPayload,
    @Query('page') page: number,
  ) {
    const limit = 4;
    const userWallet = await this.userService.findWalletByUserId(
      userData.id,
      page,
      limit,
    );
    return response('User wallet balance retrieved successfully', userWallet);
  }

  @Get()
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: Object })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  async getUser(@userPayload() userData: IPayload) {
    const user = await this.userService.getUserById(userData.id);
    return response('User fetched successfully', user);
  }

  @Patch()
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated', type: Object })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async updateUser(
    @userPayload() userData: IPayload,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.userService.updateUser(userData.id, dto);
    return response('User updated successfully', user);
  }

  @Delete('')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBearerAuth()
  async deleteUser(@userPayload() userData: IPayload) {
    const user = this.userService.deleteUser(userData.id);
    return response('User deleted successfully', user);
  }
}
