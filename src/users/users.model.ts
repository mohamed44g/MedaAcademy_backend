import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Role } from '../utils/types';
import { DepositUserWalletBalanceDto } from './dtos/user-deposit-dto';
import { CreateUserDto } from './dtos/create-user-dto';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty_id: number;
  password: string;
  role: Role;
  created_at: Date;
}

@Injectable()
export class UserModel {
  constructor(private dbService: DatabaseService) {}

  async createUser(user: any): Promise<any> {
    await this.dbService.transaction(async (client) => {
      const query = `
      INSERT INTO users (name, email, phone, specialty_id, password, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
      const values = [
        user.name,
        user.email,
        user.phone,
        user.specialty_id,
        user.password,
        user.role,
      ];

      const result = await this.dbService.query(query, values);
      result[0];

      await client.query(
        `INSERT INTO user_sessions (user_id, device_token) VALUES ($1, $2);`,
        [result[0].id, user.fingerprint],
      );

      return result[0];
    });
  }

  async findUserByEmail(email: string, phone?: string): Promise<User | null> {
    const query =
      'SELECT id,password,email,role FROM users WHERE email = $1 OR phone = $2;';
    const result = await this.dbService.query(query, [email, phone]);
    return result[0] || null;
  }

  async depositUserWalletBalance(
    userIdToDeposit: number,
    dto: DepositUserWalletBalanceDto,
  ): Promise<any> {
    await this.dbService.transaction(async (client) => {
      const query = `
      UPDATE users
      SET wallet_balance = wallet_balance + $1
      WHERE id = $2;
    `;
      await client.query(query, [dto.amount, userIdToDeposit]);

      const query2 = `
      INSERT INTO wallet_transactions (user_id, amount,description, type)
      VALUES ($1, $2, $3, $4);
    `;
      await client.query(query2, [
        userIdToDeposit,
        dto.amount,
        `شحن رصيد بقيمة ${dto.amount}`,
        'deposit',
      ]);

      return true;
    });
  }

  async findWalletByUserId(
    userId: number,
    page: number = 1,
    limit: number,
  ): Promise<{
    wallet: { balance: number; currency: string };
    transactions: any[];
    total: number;
  }> {
    console.log(page);
    const offset = (page - 1) * limit;

    // كويري لجلب رصيد المحفظة من جدول users
    const walletQuery = `
    SELECT wallet_balance
    FROM users 
    WHERE id = $1;
  `;
    const walletResult = await this.dbService.query(walletQuery, [userId]);

    // التأكد من وجود المحفظة
    if (!walletResult.length) {
      throw new Error('Wallet not found for this user');
    }

    // الكويري المدمج باستخدام CTE
    const combinedQuery = `
    WITH transaction_count AS (
      SELECT COUNT(*) AS total
      FROM wallet_transactions 
      WHERE user_id = $1
    )
    SELECT 
      t.id,
      t.amount,
      t.type,
      t.description,
      t.created_at AS createdAt,
      (SELECT total FROM transaction_count) AS total
    FROM wallet_transactions t
    WHERE t.user_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
    const transactionsResult = await this.dbService.query(combinedQuery, [
      userId,
      limit,
      offset,
    ]);

    // تحويل النتائج لتتناسب مع الهيكلية المطلوبة
    const transactions = transactionsResult.map((row: any) => ({
      id: row.id,
      amount: row.amount,
      type: row.type,
      description: row.description,
      createdAt: row.createdat,
      status: row.status,
    }));

    // استخراج العدد الإجمالي (يأتي مع كل صف، لذا نأخذ الأول)
    const total =
      transactionsResult.length > 0
        ? parseInt(transactionsResult[0].total, 10)
        : 0;

    return {
      wallet: {
        balance: walletResult[0].wallet_balance,
        currency: 'دولار',
      },
      transactions,
      total,
    };
  }

  async getUserById(id: number): Promise<User | null> {
    const query =
      'SELECT u.id, u.name, u.email, u.phone, u.specialty_id, u.created_at as joinDate, s.name as specialty_name FROM users u JOIN specialties s ON u.specialty_id = s.id WHERE u.id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = Object.values(updates);
    const query = `UPDATE users SET ${fields} WHERE id = $${values.length + 1} RETURNING *;`;
    const result = await this.dbService.query(query, [...values, id]);
    return result[0] || null;
  }

  async deleteUser(id: number): Promise<void> {
    const query = 'DELETE FROM users WHERE id = $1;';
    await this.dbService.query(query, [id]);
  }

  async addUserSession(user_id: number, device_token: string): Promise<void> {
    const query = `
      INSERT INTO user_sessions (user_id, device_token)
      VALUES ($1, $2)
      ON CONFLICT (user_id, device_token) DO NOTHING;
    `;
    await this.dbService.query(query, [user_id, device_token]);
  }

  async getUserSessions(user_id: number): Promise<any> {
    const query = 'SELECT device_token FROM user_sessions WHERE user_id = $1;';
    const result = await this.dbService.query(query, [user_id]);
    return result;
  }

  async addSession(user_id: number, device_token: string): Promise<void> {
    const query = `
      INSERT INTO user_sessions (user_id, device_token)
      VALUES ($1, $2)
      ON CONFLICT (user_id, device_token) DO NOTHING;
    `;
    await this.dbService.query(query, [user_id, device_token]);
  }

  async findAllUsers(): Promise<User[]> {
    const query =
      'SELECT id, username, email, role, created_at, updated_at FROM users;';
    return await this.dbService.query(query);
  }

  async updateUserRole(
    id: number,
    role: 'user' | 'admin' | 'super_admin',
  ): Promise<User | null> {
    const query = `
      UPDATE users
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email, role, created_at, updated_at;
    `;
    const result = await this.dbService.query(query, [role, id]);
    return result[0] || null;
  }

  async updateUserStatus(
    id: number,
    status: 'active' | 'banned',
  ): Promise<User | null> {
    const query = `
      UPDATE users
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email, role, status, created_at, updated_at;
    `;
    const result = await this.dbService.query(query, [status, id]);
    return result[0] || null;
  }
}
