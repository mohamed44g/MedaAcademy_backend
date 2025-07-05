import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }

  async onModuleInit() {
    try {
      await this.pool.connect();
      console.log('Connected to PostgreSQL database');
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Disconnected from PostgreSQL database');
  }

  async query(text: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  async transaction(
    callback: (client: PoolClient) => Promise<any>,
  ): Promise<any> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
