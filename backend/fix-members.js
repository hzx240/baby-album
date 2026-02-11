const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMembers() {
  // 获取所有有 familyId 但没有 FamilyMember 记录的用户
  const users = await prisma.user.findMany({
    where: {
      familyId: { not: null }
    },
    select: {
      id: true,
      familyId: true
    }
  });

  console.log('Found', users.length, 'users with familyId');

  for (const user of users) {
    // 检查是否已有 FamilyMember 记录
    const existing = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: user.familyId,
          userId: user.id
        }
      }
    });

    if (!existing) {
      // 创建 FamilyMember 记录
      await prisma.familyMember.create({
        data: {
          familyId: user.familyId,
          userId: user.id,
          role: 'OWNER'
        }
      });
      console.log('Created FamilyMember for user', user.id);
    } else {
      console.log('FamilyMember already exists for user', user.id);
    }
  }

  console.log('Done!');
}

fixMembers()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
