const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const familyId = '12c8a505-4740-4378-b2b2-d34e0c66afd2';
  
  // 使用和 getMembers 相同的查询
  const members = await prisma.familyMember.findMany({
    where: { familyId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });

  console.log('Raw members from DB:', JSON.stringify(members, null, 2));

  // 转换为返回格式
  const result = members.map((member) => ({
    id: member.id,
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt,
    user: member.user,
  }));

  console.log('Formatted result:', JSON.stringify(result, null, 2));
}

test()
  .then(() => prisma.$disconnect())
  .catch(console.error);
