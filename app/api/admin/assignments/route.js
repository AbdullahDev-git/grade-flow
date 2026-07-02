import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { notifyAllStudents } from "@/lib/notifications";

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assignments = await prisma.assignment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { submissions: true } },
    },
  });

  const totalStudents = await prisma.user.count({
    where: { role: "student" },
  });

  const result = assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    deadline: a.deadline,
    status: a.status,
    maxFileSize: a.maxFileSize,
    submissions: a._count.submissions,
    totalStudents,
  }));

  return NextResponse.json({ assignments: result });
}

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const deadline = formData.get("deadline");
    const maxFileSize = formData.get("maxFileSize");
    const pdfFile = formData.get("requirementsPDF");

    if (!title || !description || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let requirementsPDF = null;

    if (pdfFile && pdfFile instanceof File) {
      const uploadsDir = path.join(process.cwd(), "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const ext = pdfFile.name.split(".").pop();
      const filename = `requirements-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      await writeFile(path.join(uploadsDir, filename), buffer);
      requirementsPDF = `/uploads/${filename}`;
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        requirementsPDF,
        maxFileSize: maxFileSize ? parseInt(maxFileSize) : 10,
        createdById: admin.id,
      },
    });

    await notifyAllStudents({
      title: "New Assignment",
      message: `"${title}" has been posted. Deadline: ${new Date(deadline).toLocaleDateString()}`,
      link: "/student/assignments",
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
  }

  try {
    await prisma.grade.deleteMany({
      where: { submission: { assignmentId: id } },
    });
    await prisma.submission.deleteMany({ where: { assignmentId: id } });
    await prisma.assignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
