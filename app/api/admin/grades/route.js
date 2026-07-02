import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  const studentId = searchParams.get("studentId");

  const where = {};
  if (assignmentId) where.assignmentId = assignmentId;
  if (studentId) where.studentId = studentId;

  const grades = await prisma.grade.findMany({
    orderBy: { gradedAt: "desc" },
    include: {
      submission: {
        include: {
          student: { select: { id: true, name: true, email: true } },
          assignment: { select: { id: true, title: true } },
        },
      },
    },
    where: assignmentId || studentId ? { submission: where } : undefined,
  });

  const result = grades.map((g) => ({
    id: g.id,
    studentName: g.submission.student.name,
    studentEmail: g.submission.student.email,
    assignmentTitle: g.submission.assignment.title,
    assignmentId: g.submission.assignment.id,
    score: g.totalScore,
    gradedAt: g.gradedAt,
  }));

  return NextResponse.json({ grades: result });
}
