import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      assignment: { select: { id: true, title: true } },
      grade: true,
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

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
  });
}

export async function POST(request, { params }) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const { totalScore, categoryScores } = await request.json();

  const existingGrade = await prisma.grade.findUnique({
    where: { submissionId: id },
  });

  const gradeData = {
    totalScore: totalScore ?? 0,
    codeQuality: categoryScores?.codeQuality ?? 0,
    structure: categoryScores?.structure ?? 0,
    requirementsMet: categoryScores?.requirementsMet ?? 0,
    bestPractices: categoryScores?.bestPractices ?? 0,
    noErrors: categoryScores?.noErrors ?? 0,
  };

  let grade;
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
}
