import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const expiredAssignments = await prisma.assignment.findMany({
      where: {
        status: "active",
        deadline: { lt: now },
      },
      select: { id: true, title: true },
    });

    if (expiredAssignments.length === 0) {
      return NextResponse.json({ message: "No expired assignments", closed: 0 });
    }

    const result = await prisma.assignment.updateMany({
      where: {
        id: { in: expiredAssignments.map((a) => a.id) },
      },
      data: { status: "closed" },
    });

    await prisma.notification.createMany({
      data: expiredAssignments.map((a) => ({
        userId: "admin-notification",
        title: "Assignment Auto-Closed",
        message: `"${a.title}" deadline passed and has been auto-closed.`,
        link: "/admin/assignments",
      })),
    });

    return NextResponse.json({
      message: `Closed ${result.count} expired assignment(s)`,
      closed: result.count,
      assignments: expiredAssignments.map((a) => a.title),
    });
  } catch (error) {
    console.error("Cron close-assignments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}