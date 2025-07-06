// src/common/services/mongo.service.ts
import { Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';

@Injectable()
export class MongoService {
  private client: MongoClient;
  private readonly url =
    'mongodb+srv://medaplus56:557Fdz2ahow6BvDV@cluster0.8oihjrk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  private readonly dbName = 'meda-plus';
  private readonly collectionName = 'sessions';

  constructor() {
    this.client = new MongoClient(this.url);
  }

  async connect() {
    await this.client.connect();
    return this.client.db(this.dbName).collection(this.collectionName);
  }

  async storeVerificationCode(email: string, code: string) {
    const collection = await this.connect();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL
    await collection.updateOne(
      { email },
      { $set: { verificationCode: code, expiresAt } },
      { upsert: true },
    );
    await this.client.close();
  }

  async getVerificationCode(email: string): Promise<string | null> {
    const collection = await this.connect();
    const doc = await collection.findOne({ email });
    await this.client.close();
    return doc?.verificationCode || null;
  }

  async clearVerificationCode(email: string) {
    const collection = await this.connect();
    await collection.deleteOne({ email });
    await this.client.close();
  }

  // Method to ensure TTL index is created
  async ensureTTLIndex() {
    const collection = await this.connect();
    try {
      await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      console.log('TTL index created on expiresAt field');
    } catch (error) {
      console.error('Error creating TTL index:', error);
    } finally {
      await this.client.close();
    }
  }
}
