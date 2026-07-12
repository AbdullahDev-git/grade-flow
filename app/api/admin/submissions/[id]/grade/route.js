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

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignment: { select: { id: true, title: true, course: true } },
        grade: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const criteria = await prisma.gradingCriteria.findUnique({
      where: { course: submission.assignment.course },
    });

    return NextResponse.json({
      submission: {
        id: submission.id,
        zipFile: submission.zipFile,
        submittedAt: submission.submittedAt,
        status: submission.status,
        student: submission.student,
        assignment: submission.assignment,
      },
      grade: submission.grade,
      criteria: criteria?.metrics || {},
    });
  } catch (error) {
    console.error("Grade GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { assignment: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const { totalScore, scores } = await request.json();

    const criteria = await prisma.gradingCriteria.findUnique({
      where: { course: submission.assignment.course },
    });

    const gradeData = {
      totalScore: totalScore ?? 0,
      scores: scores || {},
      criteriaId: criteria?.id,
    };

    let grade;
    const existingGrade = await prisma.grade.findUnique({
      where: { submissionId: id },
    });

    if (existingGrade) {
      grade = await prisma.grade.update({
        where: { submissionId: id },
        data: gradeData,
      });
    } else {
      grade = await prisma.grade.create({
        data: {
          submissionId: id,
          ...gradeData,
        },
      });
    }

    return NextResponse.json({ grade });
  } catch (error) {
    console.error("Grade POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
