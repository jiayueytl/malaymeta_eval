import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-use-32-chars-min"
);
const COOKIE_NAME = "mm_session";

export interface Session {
  username: string;
  token: string; // DOT access token
}

export async function createSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get(COOKIE_NAME)?.value;
    if (!jwt) return null;
    const { payload } = await jwtVerify(jwt, SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export function getQa1Users(): string[] {
  return (process.env.QA1_USERS ?? "")
    .split(",").map((u) => u.trim().toLowerCase()).filter(Boolean);
}

export function getQa2Users(): string[] {
  return (process.env.QA2_USERS ?? "")
    .split(",").map((u) => u.trim().toLowerCase()).filter(Boolean);
}

export function getQaUsers(): string[] {
  return [...new Set([...getQa1Users(), ...getQa2Users()])];
}

export { COOKIE_NAME };
