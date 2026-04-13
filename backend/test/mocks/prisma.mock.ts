/**
 * Prisma Service Mock
 * Mocks all Prisma database operations
 */

import { mockDeep, MockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Create mock Prisma client
export const mockPrismaService = mockDeep<PrismaClient>();

// Reset mocks before each test
beforeEach(() => {
  mockPrismaService.user.findUnique.mockReset();
  mockPrismaService.user.findMany.mockReset();
  mockPrismaService.user.findFirst.mockReset();
  mockPrismaService.user.create.mockReset();
  mockPrismaService.user.update.mockReset();
  mockPrismaService.user.delete.mockReset();

  mockPrismaService.family.findUnique.mockReset();
  mockPrismaService.family.findMany.mockReset();
  mockPrismaService.family.create.mockReset();
  mockPrismaService.family.update.mockReset();

  mockPrismaService.child.findUnique.mockReset();
  mockPrismaService.child.findMany.mockReset();
  mockPrismaService.child.findFirst.mockReset();
  mockPrismaService.child.create.mockReset();
  mockPrismaService.child.update.mockReset();
  mockPrismaService.child.delete.mockReset();

  mockPrismaService.photo.findUnique.mockReset();
  mockPrismaService.photo.findMany.mockReset();
  mockPrismaService.photo.findFirst.mockReset();
  mockPrismaService.photo.create.mockReset();
  mockPrismaService.photo.update.mockReset();
  mockPrismaService.photo.delete.mockReset();
  mockPrismaService.photo.count.mockReset();

  mockPrismaService.invitation.findUnique.mockReset();
  mockPrismaService.invitation.findMany.mockReset();
  mockPrismaService.invitation.findFirst.mockReset();
  mockPrismaService.invitation.create.mockReset();
  mockPrismaService.invitation.update.mockReset();
  mockPrismaService.invitation.delete.mockReset();

  mockPrismaService.member.findMany.mockReset();
  mockPrismaService.member.create.mockReset();
  mockPrismaService.member.delete.mockReset();

  mockPrismaService.photoTag.findMany.mockReset();
  mockPrismaService.photoTag.createMany.mockReset();
  mockPrismaService.photoTag.deleteMany.mockReset();

  mockPrismaService.$transaction.mockReset();
});

export default mockPrismaService;
