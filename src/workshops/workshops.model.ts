import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Workshop {
  id?: number;
  title: string;
  description: string;
  price: number;
  event_date: string;
  event_time: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class WorkshopModel {
  constructor(private dbService: DatabaseService) {}

  async createWorkshop(workshop: any, posterPath: string): Promise<Workshop> {
    const query = `
      INSERT INTO workshops (title, description, price, event_date, event_time, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      workshop.title,
      workshop.description,
      workshop.price,
      workshop.event_date,
      workshop.event_time,
      posterPath,
    ];
    const result = await this.dbService.query(query, values);
    return result[0];
  }

  async findAllWorkshops(
    page: number,
    limit: number,
  ): Promise<{ data: Workshop[]; total: number }> {
    const offset = (page - 1) * limit;
    const totalQuery = 'SELECT COUNT(*) FROM workshops;';
    const totalResult = await this.dbService.query(totalQuery);
    const total = totalResult[0].count;
    const query =
      'SELECT *FROM workshops ORDER BY event_date ASC LIMIT $1 OFFSET $2;';
    const result = await this.dbService.query(query, [limit, offset]);
    return { data: result, total };
  }

  async getLatestWorkshops(): Promise<Workshop[]> {
    const query = 'SELECT * FROM workshops ORDER BY event_date DESC LIMIT 3;';
    return await this.dbService.query(query);
  }

  async findWorkshopById(id: number): Promise<Workshop | null> {
    const query = 'SELECT * FROM workshops WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result[0] || null;
  }

  async updateWorkshop(
    id: number,
    updates: Partial<Workshop>,
  ): Promise<Workshop | null> {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = Object.values(updates);
    const query = `
      UPDATE workshops
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length + 1}
      RETURNING *;
    `;
    const result = await this.dbService.query(query, [...values, id]);
    return result[0] || null;
  }

  async deleteWorkshop(id: number): Promise<void> {
    const query = 'DELETE FROM workshops WHERE id = $1;';
    await this.dbService.query(query, [id]);
  }

  async registerUserForWorkshop(
    userId: number,
    workshopId: number,
  ): Promise<void> {
    const query = `
      INSERT INTO workshop_registrations (user_id, workshop_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `;
    await this.dbService.query(query, [userId, workshopId]);
  }

  async findRegistrationsByWorkshopId(workshopId: number): Promise<any[]> {
    const query = `
      SELECT u.id, u.username, u.email, wr.registered_at
      FROM workshop_registrations wr
      JOIN users u ON wr.user_id = u.id
      WHERE wr.workshop_id = $1
      ORDER BY wr.registered_at DESC;
    `;
    return await this.dbService.query(query, [workshopId]);
  }

  async findUserRegistrations(userId: number): Promise<Workshop[]> {
    const query = `
      SELECT w.*
      FROM workshops w
      JOIN workshop_registrations wr ON w.id = wr.workshop_id
      WHERE wr.user_id = $1
      ORDER BY w.event_date ASC;
    `;
    return await this.dbService.query(query, [userId]);
  }

  async validateWorkshopId(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM workshops WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result.length > 0;
  }

  async validateUserId(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE id = $1 AND status = $2;';
    const result = await this.dbService.query(query, [id, 'active']);
    return result.length > 0;
  }
}
