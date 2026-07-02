import { NextResponse } from "next/server";

export async function GET() {
  const jwtSecret = process.env.JWT_SECRET;
  return NextResponse.json({
    hasSecret: !!jwtSecret,
    secretLength: jwtSecret?.length,
    secretStart: jwtSecret?.slice(0, 10),
  });
}
