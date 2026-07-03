import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { name, email, password, role, course } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    if (existing && existing.inviteStatus === "invited") {
      user = await prisma.user.update({
        where: { email },
        data: { name, password: hashedPassword, inviteStatus: "joined", ...(course ? { course } : {}) },
      });
    } else if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || "student",
          course: course || "fullstack",
          inviteStatus: "joined",
        },
      });
    }

    const token = await createToken({ id: user.id, role: user.role, name: user.name, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, course: user.course },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
