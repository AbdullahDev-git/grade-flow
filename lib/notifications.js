import prisma from "@/lib/prisma";

export async function createNotification({ userId, title, message, link }) {
  return prisma.notification.create({
    data: { userId, title, message, link },
  });
}

export async function notifyAdmin({ title, message, link }) {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });

  if (admins.length === 0) return [];

  return Promise.all(
    admins.map((a) =>
      prisma.notification.create({
        data: { userId: a.id, title, message, link },
      })
    )
  );
}

export async function notifyAllStudents({ title, message, link }) {
  const students = await prisma.user.findMany({
    where: { role: "student" },
    select: { id: true },
  });

  if (students.length === 0) return [];

  return prisma.notification.createMany({
    data: students.map((s) => ({
      userId: s.id,
      title,
      message,
      link,
    })),
  });
}
