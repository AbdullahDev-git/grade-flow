import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { notifyAdmin } from "@/lib/notifications";

export async function POST(request, { params }) {
  const user = await verifyAuth(request);
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
  });

  if (!assignment || assignment.status !== "active") {
    return NextResponse.json({ error: "Assignment not found or closed" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!file.name.endsWith(".zip")) {
    return NextResponse.json({ error: "Only ZIP files allowed" }, { status: 400 });
  }

  const maxSize = (assignment.maxFileSize || 10) * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File exceeds ${assignment.maxFileSize}MB limit` }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `${user.id}_${id}_${Date.now()}.zip`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const submission = await prisma.submission.create({
    data: {
      studentId: user.id,
      assignmentId: id,
      zipFile: `/uploads/${fileName}`,
    },
  });

  await notifyAdmin({
    title: "New Submission",
    message: `${user.name} submitted "${assignment.title}"`,
    link: `/admin/submissions/${submission.id}`,
  });

  return NextResponse.json({
    message: "Submitted successfully!",
    submission: { id: submission.id, submittedAt: submission.submittedAt },
  });
}
