import { jwtVerify, SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
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
