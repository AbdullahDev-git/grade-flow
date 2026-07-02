import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await prisma.user.findMany({
    where: { role: "student" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      inviteStatus: true,
      createdAt: true,
      name: true,
    },
  });

  const results = students.map((s) => ({
    email: s.email,
    status: s.inviteStatus,
    name: s.name,
    invitedAt: s.createdAt,
    passwordChanged: s.passwordChanged,
  }));

  return NextResponse.json({ results });
}

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { students } = await request.json();

  if (!students || !Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: "Provide at least one student" }, { status: 400 });
  }

  const results = [];

  for (const { name, email } of students) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      results.push({ email: existing.email, name: existing.name, status: existing.inviteStatus, password: null, passwordChanged: existing.passwordChanged });
      continue;
    }

    const password = generatePassword();
    const hashed = await bcrypt.hash(password, 10);
    const displayName = name || email.split("@")[0];

    const user = await prisma.user.create({
      data: {
        name: displayName,
        email,
        password: hashed,
        role: "student",
        inviteStatus: "joined",
        passwordChanged: false,
      },
    });

    results.push({
      email: user.email,
      name: user.name,
      status: "joined",
      password,
      passwordChanged: false,
    });
  }

  return NextResponse.json({ results });
}
