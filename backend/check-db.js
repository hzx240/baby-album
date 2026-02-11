const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const userId = '1e5d0c11-1eed-4ea7-a434-41e11ab345d9';
  
  // 获取用户
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, familyId: true, email: true }
  });
  console.log('User:', user);

  // 获取该用户的 FamilyMember 记录
  const members = await prisma.familyMember.findMany({
    where: { userId: userId }
  });
  console.log('FamilyMembers for this user:', members);

  // 获取该家庭的所有成员
  if (user?.familyId) {
    const familyMembers = await prisma.familyMember.findMany({
      where: { familyId: user.familyId },
      include: { user: { select: { id: true, email: true } } }
    });
    console.log('All FamilyMembers in family:', familyMembers);
  }
}

check()
  .then(() => prisma.$disconnect())
  .catch(console.error);
