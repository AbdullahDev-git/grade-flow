const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  const r = await prisma.user.deleteMany({ where: { role: "student" } });
  console.log(`Cleared everything. Deleted ${r.count} students`);
  await prisma.$disconnect();
}

main();
