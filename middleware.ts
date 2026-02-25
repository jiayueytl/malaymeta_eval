import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-use-32-chars-min"
);

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return NextResponse.next();

  const jwt = req.cookies.get("mm_session")?.value;
  if (!jwt) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(jwt, SECRET);
    const username = (payload as { username: string }).username?.toLowerCase();

    const qa1Users = (process.env.QA1_USERS ?? "").split(",").map(u => u.trim().toLowerCase()).filter(Boolean);
    const qa2Users = (process.env.QA2_USERS ?? "").split(",").map(u => u.trim().toLowerCase()).filter(Boolean);
    const allQaUsers = [...new Set([...qa1Users, ...qa2Users])];

    if (pathname.startsWith("/qa")) {
      if (!allQaUsers.includes(username)) {
        return NextResponse.redirect(new URL("/tasks", req.url));
      }
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("mm_session", "", { maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};