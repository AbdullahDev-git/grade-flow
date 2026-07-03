import prisma from "@/lib/prisma";

export async function createNotification({ userId, title, message, link }) {
  try {
    return await prisma.notification.create({
      data: { userId, title, message, link },
    });
  } catch (error) {
    console.error("createNotification error:", error);
    return null;
  }
}

export async function notifyAdmin({ title, message, link }) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    if (admins.length === 0) return [];

    return await Promise.all(
      admins.map((a) =>
        prisma.notification.create({
          data: { userId: a.id, title, message, link },
        })
      )
    );
  } catch (error) {
    console.error("notifyAdmin error:", error);
    return [];
  }
}

export async function notifyAllStudents({ title, message, link }) {
  try {
    const students = await prisma.user.findMany({
      where: { role: "student" },
      select: { id: true },
    });

    if (students.length === 0) return [];

    return await prisma.notification.createMany({
      data: students.map((s) => ({
        userId: s.id,
        title,
        message,
        link,
      })),
    });
  } catch (error) {
    console.error("notifyAllStudents error:", error);
    return null;
  }
}
