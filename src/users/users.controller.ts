import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Query,
  BadRequestException,
  Req,
  Put,
  Res,
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
import { VerifyDto } from './dtos/verify-dto';
import { UpdateUserPasswordDto } from './dtos/update-user-password-dto';
import { ForgetPasswordDto } from './dtos/forget-password-dto';
import { ResetPasswordDto } from './dtos/reset-password-dto';
import { Response } from 'express';

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
    return response('تم التسجيل بنجاح', user);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: Object })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const deviceToken = dto.fingerprint;
    const user = await this.userService.login(dto, deviceToken);
    await res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      status: 'success',
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token: user.token,
        refreshToken: user.refreshToken,
      },
    });
    // return response('تم تسجيل الدخول بنجاح', user);
  }

  //verfcation user buy send a otp code his gmail
  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Verify user' })
  @ApiResponse({ status: 200, description: 'User verified', type: Object })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async verifyUser(@Body() dto: VerifyDto) {
    const code = await this.userService.verifyUser(dto);
    return response('تم ارسال رمز التحقق بنجاح', code);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful', type: Object })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async logout(@Req() req: CustomRequest) {
    //remove token from cookie
    req.res?.clearCookie('refreshToken');
    return response('تم تسجيل الخروج بنجاح');
  }

  //make forget password
  @Public()
  @Post('forget-password')
  @ApiOperation({ summary: 'Forget password' })
  @ApiResponse({
    status: 200,
    description: 'Forget password successful',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async forgetPassword(@Body() dto: ForgetPasswordDto) {
    const user = await this.userService.forgetPassword(dto);
    return response('تم ارسال رابط اعادة تعين كلمة المرور بنجاح', user);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({
    status: 200,
    description: 'Reset password successful',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Query('token') token: string,
  ) {
    if (!token) {
      throw new BadRequestException('التوكن غير صحيح أو انتهت صلاحيته');
    }
    const user = await this.userService.resetPassword(dto, token);
    return response('تم تغيير كلمة المرور بنجاح', user);
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
    return response('تم ايداع الرصيد بنجاح', user);
  }

  @Roles(Role.user, Role.admin, Role.super_admin)
  @Put('password')
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({
    status: 200,
    description: 'User password updated',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async updateUserPassword(
    @userPayload() userData: IPayload,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    const user = await this.userService.updateUserPassword(userData.id, dto);
    return response('تم تغيير كلمة المرور بنجاح', user);
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
    return response('تم استرجاع رصيد المحفظة بنجاح', userWallet);
  }

  @Get()
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: Object })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  async getUser(@userPayload() userData: IPayload, @Req() req: any) {
    const refreshToken = req.cookies.refreshToken;
    console.log('req.cookies', req.cookies);
    console.log('req.headers', req.headers);
    const user = await this.userService.getUserById(userData.id);
    return response('تم استرجاع المستخدم بنجاح', user);
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
    return response('تم تحديث المستخدم بنجاح', user);
  }

  @Delete('')
  @Roles(Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBearerAuth()
  async deleteUser(@userPayload() userData: IPayload) {
    const user = this.userService.deleteUser(userData.id);
    return response('تم حذف المستخدم بنجاح', user);
  }

  //refresh token
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: Object })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async refreshToken(@Req() req: CustomRequest) {
    const refreshToken = req.cookies.refreshToken;
    console.log('req.cookies', req.cookies);
    console.log('req.headers', req.headers);
    const accessToken = await this.userService.refreshToken(refreshToken);
    return response('تم تحديث التوكن بنجاح', accessToken);
  }
}
