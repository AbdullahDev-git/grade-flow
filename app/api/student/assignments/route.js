import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request) {
  const user = await verifyAuth(request);
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const assignments = await prisma.assignment.findMany({
    where: { status: "active" },
    orderBy: { deadline: "asc" },
  });

  const submissions = await prisma.submission.findMany({
    where: { studentId: user.id },
    select: { assignmentId: true },
  });

  const submittedIds = new Set(submissions.map((s) => s.assignmentId));

  const result = assignments.map((a) => {
    let status;
    if (submittedIds.has(a.id)) {
      status = "submitted";
    } else if (a.deadline < now) {
      status = "overdue";
    } else {
      status = "pending";
    }
    return {
      id: a.id,
      title: a.title,
      deadline: a.deadline,
      status,
    };
  });

  return NextResponse.json({ assignments: result });
}
