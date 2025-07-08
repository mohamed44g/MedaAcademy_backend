import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserModel, User } from './users.model';
import { CreateUserDto } from './dtos/create-user-dto';
import { UpdateUserDto } from './dtos/update-user-dto';
import { LoginDto } from './dtos/login-user-dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, IPayload } from '../utils/types';
import { DepositUserWalletBalanceDto } from './dtos/user-deposit-dto';
import { compareFingerprints } from 'src/utils/compareFingerPrint';
import { VerifyDto } from './dtos/verify-dto';
import { generateVerificationCode } from 'src/utils/generateCode';
import { MailerService } from '@nestjs-modules/mailer';
import { MongoService } from 'src/database/mongo.service';

@Injectable()
export class UserService {
  constructor(
    private userModel: UserModel,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
    private readonly mongoService: MongoService,
  ) {}

  public async sendVerificationCode(
    email: string,
    code: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      from: 'Med A+ Academy <medaplus56@gmail.com>',
      subject: 'Testing Nest Mailermodule with template ✔',
      html: 'هذا كود التحقق من حسابك ' + code,
    });
  }

  async register(dto: CreateUserDto): Promise<User> {
    const storedCode = await this.mongoService.getVerificationCode(dto.email);
    if (dto.verificationCode !== storedCode) {
      throw new BadRequestException('رمز التحقق غير صحيح.');
    }
    const user = await this.userModel.findUserByEmail(dto.email, dto.phone);
    if (user) {
      throw new BadRequestException('الايميل او رقم الهاتف مستخدم من قبل');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userModel.createUser({
      ...dto,
      password: hashedPassword,
      role: Role.user,
    });
  }

  async login(
    dto: LoginDto,
    deviceToken: string,
  ): Promise<{ token: string; user: User }> {
    const user = await this.userModel.findUserByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('الايميل او كلمة السر غير صحيحة');
    }

    // Get user sessions
    const userSessions = await this.userModel.getUserSessions(user.id);

    // Check for a matching session
    let isMatch = false;
    for (const session of userSessions) {
      if (
        (await compareFingerprints(session.device_token, deviceToken)) >= 75
      ) {
        isMatch = true;
        break;
      }
    }

    console.log(
      'userSessions.length is:',
      userSessions.length,
      'and match is :',
      isMatch,
    );
    // If no match, handle based on session count
    if (!isMatch) {
      if (userSessions.length != 2) {
        await this.userModel.addUserSession(user.id, deviceToken);
      } else if (userSessions.length >= 2) {
        throw new BadRequestException(
          'وصلت للحد الاقصى من الاجهزة لا يمكنك الدخول من جهاز اخر.',
        );
      }
    }

    // Generate JWT
    const payload: IPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });

    return { token, user };
  }

  async verifyUser(dto: VerifyDto): Promise<boolean> {
    const verificationCode = generateVerificationCode();
    await this.sendVerificationCode(dto.email, verificationCode);
    await this.mongoService.storeVerificationCode(dto.email, verificationCode);
    return true;
  }

  async depositUserWalletBalance(
    userIdToDeposit: number,
    dto: DepositUserWalletBalanceDto,
  ): Promise<User> {
    const user = await this.userModel.getUserById(userIdToDeposit);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userModel.depositUserWalletBalance(userIdToDeposit, dto);
  }

  async findWalletByUserId(
    id: number,
    page: number,
    limit: number,
  ): Promise<any> {
    return this.userModel.findWalletByUserId(id, page, limit);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userModel.getUserById(id);
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User | null> {
    const updates: Partial<User> = { ...dto };
    if (dto.password) {
      updates.password = await bcrypt.hash(dto.password, 10);
    }
    return this.userModel.updateUser(id, updates);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userModel.deleteUser(id);
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.findAllUsers();
  }

  async updateUserRole(id: number, role: Role): Promise<User | null> {
    return this.userModel.updateUserRole(id, role);
  }
  role;

  async updateUserStatus(
    id: number,
    status: 'active' | 'banned',
  ): Promise<User | null> {
    return this.userModel.updateUserStatus(id, status);
  }
}
