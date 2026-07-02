const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.grade.deleteMany({
    where: { submission: { student: { role: 'student' } } },
  });
  await prisma.submission.deleteMany({
    where: { student: { role: 'student' } },
  });
  await prisma.assignment.deleteMany({
    where: { createdBy: { role: 'student' } },
  });
  const { count } = await prisma.user.deleteMany({
    where: { role: 'student' },
  });
  console.log(`Deleted ${count} student(s)`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  prisma.$disconnect();
  process.exit(1);
});
