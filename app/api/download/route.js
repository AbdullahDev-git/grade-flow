import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "download";
  const token = searchParams.get("token");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  // Allow token in query param for direct links
  let user = null;
  if (token) {
    try {
      const { verifyToken } = await import("@/lib/auth");
      user = verifyToken(token);
    } catch {
      user = null;
    }
  } else {
    user = await verifyAuth(request);
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const buffer = Buffer.from(await res.arrayBuffer());

    const contentType = filename.endsWith(".pdf") ? "application/pdf" : "application/zip";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
