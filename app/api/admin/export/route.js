import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.user.findMany({
      where: { role: "student" },
      orderBy: { name: "asc" },
    });

    const assignments = await prisma.assignment.findMany({
      orderBy: { createdAt: "asc" },
    });

    const submissions = await prisma.submission.findMany({
      include: {
        grade: true,
      },
    });

    const gradeMap = {};
    for (const sub of submissions) {
      if (sub.grade?.totalScore != null) {
        gradeMap[`${sub.studentId}_${sub.assignmentId}`] = sub.grade.totalScore;
      }
    }

    const now = new Date();

    const header = ["Student Name", ...assignments.map((_, i) => `Assignment ${i + 1}`), "Total Marks"].join(",");

    const rows = students.map((student) => {
      let total = 0;
      const scores = assignments.map((a) => {
        const key = `${student.id}_${a.id}`;
        if (gradeMap[key] != null) {
          total += gradeMap[key];
          return gradeMap[key];
        }
        const hasSubmission = submissions.some((s) => s.studentId === student.id && s.assignmentId === a.id);
        if (!hasSubmission && new Date(a.deadline) < now) {
          return 0;
        }
        return "";
      });
      const escapedName = `"${(student.name || "").replace(/"/g, '""')}"`;
      return `${escapedName},${scores.join(",")},${total || ""}`;
    });

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=gradeflow-report.csv",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
