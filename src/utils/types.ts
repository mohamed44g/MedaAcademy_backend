import { Request } from 'express';

export interface CustomRequest extends Request {
  user?: IPayload;
}

export interface IPayload {
  id: number;
  email: string;
  role: Role;
}

export enum Role {
  super_admin = 'super_admin',
  admin = 'admin',
  user = 'user',
}

export interface Specialties {
  id: number;
  name: string;
}
