import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { id: true, name: true, email: true } },
        grade: true,
      },
    });

    return NextResponse.json({
      assignment: { id: assignment.id, title: assignment.title },
      submissions,
    });
  } catch (error) {
    console.error("Admin assignment submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
