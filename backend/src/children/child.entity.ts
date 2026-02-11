import { Child as PrismaChild } from '@prisma/client';

export type Child = PrismaChild;

export interface CreateChildDto {
  name: string;
  avatar?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface UpdateChildDto {
  name?: string;
  avatar?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}
