import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { uploadFile } from "@/lib/cloudinary";
import { notifyAdmin } from "@/lib/notifications";

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const submission = await prisma.submission.findFirst({
      where: { studentId: user.id, assignmentId: id },
    });

    if (!submission) {
      return NextResponse.json({ submission: null });
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        zipFile: submission.zipFile,
        submittedAt: submission.submittedAt,
        status: submission.status,
      },
    });
  } catch (error) {
    console.error("Get submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({ where: { id } });

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

    const buffer = Buffer.from(await file.arrayBuffer());

    let uploadResult;
    try {
      uploadResult = await uploadFile(buffer, `${user.id}_${id}_${Date.now()}.zip`);
    } catch {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const submission = await prisma.submission.create({
      data: {
        studentId: user.id,
        assignmentId: id,
        zipFile: uploadResult.secure_url,
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
  } catch (error) {
    console.error("Submit assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({ where: { id } });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const now = new Date();
    if (assignment.deadline < now) {
      return NextResponse.json({ error: "Submission deadline has passed" }, { status: 400 });
    }

    if (assignment.status !== "active") {
      return NextResponse.json({ error: "Assignment is closed" }, { status: 400 });
    }

    const existingSubmission = await prisma.submission.findFirst({
      where: { studentId: user.id, assignmentId: id },
    });

    if (!existingSubmission) {
      return NextResponse.json({ error: "No submission found to edit" }, { status: 404 });
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

    const buffer = Buffer.from(await file.arrayBuffer());

    let uploadResult;
    try {
      uploadResult = await uploadFile(buffer, `${user.id}_${id}_${Date.now()}.zip`);
    } catch {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        zipFile: uploadResult.secure_url,
        submittedAt: new Date(),
      },
    });

    await notifyAdmin({
      title: "Submission Updated",
      message: `${user.name} updated submission for "${assignment.title}"`,
      link: `/admin/submissions/${updatedSubmission.id}`,
    });

    return NextResponse.json({
      message: "Submission updated successfully!",
      submission: { id: updatedSubmission.id, submittedAt: updatedSubmission.submittedAt },
    });
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}