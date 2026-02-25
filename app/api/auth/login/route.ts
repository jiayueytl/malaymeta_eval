import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  // Authenticate against DOT
  const dotRes = await fetch("https://dot.ytlailabs.tech/api/v1/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      username,
      password,
      client_id: process.env.DOT_CLIENT_ID!,
      client_secret: process.env.DOT_CLIENT_SECRET!,
    }),
  }).catch(() => null);

  if (!dotRes || !dotRes.ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { access_token } = await dotRes.json();

  const jwt = await createSession({ username, token: access_token });

  const res = NextResponse.json({ ok: true, username });
  res.cookies.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return res;
}
