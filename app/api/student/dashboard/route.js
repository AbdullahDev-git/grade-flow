import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, course: true },
    });

    if (!student) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalAssignments = await prisma.assignment.count({
      where: { status: "active", course: student.course },
    });

    const submissions = await prisma.submission.findMany({
      where: { studentId: user.id },
      select: { assignmentId: true },
    });

    const submittedIds = submissions.map((s) => s.assignmentId);

    const now = new Date();

    const pendingAssignments = await prisma.assignment.findMany({
      where: {
        status: "active",
        course: student.course,
        deadline: { gte: now },
        ...(submittedIds.length > 0 ? { id: { notIn: submittedIds } } : {}),
      },
      orderBy: { deadline: "asc" },
    });

    const recentPending = pendingAssignments.length > 0 ? pendingAssignments[0] : null;

    return NextResponse.json({
      name: student.name,
      course: student.course,
      totalAssignments,
      pendingCount: pendingAssignments.length,
      recentPending: recentPending
        ? {
            id: recentPending.id,
            title: recentPending.title,
            deadline: recentPending.deadline,
          }
        : null,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
