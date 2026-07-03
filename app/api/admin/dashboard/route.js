import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalAssignments = await prisma.assignment.count();
    const totalSubmissions = await prisma.submission.count();
    const pendingReviews = await prisma.submission.count({
      where: { grade: null },
    });
    const activeStudents = await prisma.user.count({
      where: { role: "student", inviteStatus: "joined" },
    });

    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { id: true, name: true } },
        assignment: { select: { id: true, title: true } },
        grade: { select: { totalScore: true } },
      },
    });

    return NextResponse.json({
      totalAssignments,
      totalSubmissions,
      pendingReviews,
      activeStudents,
      recentSubmissions,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
