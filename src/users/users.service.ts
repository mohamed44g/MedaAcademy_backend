import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
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

@Injectable()
export class UserService {
  constructor(
    private userModel: UserModel,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userModel.createUser({
      ...dto,
      password: hashedPassword,
      role: Role.user, // Default role for new users
    });
  }

  async login(
    dto: LoginDto,
    deviceToken: string,
  ): Promise<{ token: string; user: User }> {
    const user = await this.userModel.findUserByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check device limit
    const sessionCount = await this.userModel.getUserSessionCount(user.id);
    if (sessionCount >= 2) {
      await this.userModel.removeOldestSession(user.id);
    }

    // Add new session
    await this.userModel.addUserSession(user.id, deviceToken);

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

  async updateUserStatus(
    id: number,
    status: 'active' | 'banned',
  ): Promise<User | null> {
    return this.userModel.updateUserStatus(id, status);
  }
}
