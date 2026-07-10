import { jwtVerify, SignJWT } from "jose";

const secretValue = process.env.JWT_SECRET;
if (!secretValue || secretValue.length < 16) {
  console.error("FATAL: JWT_SECRET is missing or too short. Set it in your environment variables.");
}
const secret = new TextEncoder().encode(secretValue || "fallback-placeholder-set-real-secret");

export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAuth(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const { payload } = await jwtVerify(token, secret);
    return { id: payload.id, role: payload.role, name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}

export async function verifyAdmin(request) {
  const user = await verifyAuth(request);
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}
