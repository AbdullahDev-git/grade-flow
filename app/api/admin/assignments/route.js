import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";
import { uploadFile } from "@/lib/cloudinary";
import { notifyAllStudents } from "@/lib/notifications";

export async function GET(request) {
  try {
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
      course: a.course,
      status: a.status,
      maxFileSize: a.maxFileSize,
      submissions: a._count.submissions,
      totalStudents,
    }));

    return NextResponse.json({ assignments: result });
  } catch (error) {
    console.error("Admin assignments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const deadline = formData.get("deadline");
    const course = formData.get("course");
    const maxFileSize = formData.get("maxFileSize");
    const pdfFile = formData.get("requirementsPDF");

    if (!title || !description || !deadline || !course) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let requirementsPDF = null;
    let requirementsPDFName = null;

    if (pdfFile && pdfFile.arrayBuffer) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      requirementsPDFName = pdfFile.name || null;
      const result = await uploadFile(buffer, `requirements-${Date.now()}.pdf`);
      requirementsPDF = result.secure_url;
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        course,
        requirementsPDF,
        requirementsPDFName,
        maxFileSize: maxFileSize ? parseInt(maxFileSize) : 10,
        createdById: admin.id,
      },
    });

    await notifyAllStudents({
      title: "New Assignment",
      message: `"${title}" has been posted for ${course} course. Deadline: ${new Date(deadline).toLocaleDateString()}`,
      link: "/student/assignments",
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Admin assignments POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const deadline = formData.get("deadline");
    const course = formData.get("course");
    const maxFileSize = formData.get("maxFileSize");
    const pdfFile = formData.get("requirementsPDF");

    if (!title || !description || !deadline || !course) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let requirementsPDF = existing.requirementsPDF;
    let requirementsPDFName = existing.requirementsPDFName;

    if (pdfFile && pdfFile.arrayBuffer) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      requirementsPDFName = pdfFile.name || null;
      const result = await uploadFile(buffer, `requirements-${Date.now()}.pdf`);
      requirementsPDF = result.secure_url;
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        title,
        description,
        deadline: new Date(deadline),
        course,
        requirementsPDF,
        requirementsPDFName,
        maxFileSize: maxFileSize ? parseInt(maxFileSize) : 10,
      },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Admin assignments PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Assignment ID and status required" }, { status: 400 });
    }

    if (!["active", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Admin assignments PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (!force) {
      const submissionsCount = await prisma.submission.count({ where: { assignmentId: id } });
      if (submissionsCount > 0) {
        return NextResponse.json({
          error: "Assignment has submissions. Use status='closed' to hide from students, or force=true to delete all data.",
          submissionsCount,
        }, { status: 400 });
      }
    }

    await prisma.grade.deleteMany({ where: { submission: { assignmentId: id } } });
    await prisma.submission.deleteMany({ where: { assignmentId: id } });
    await prisma.assignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin assignments DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}