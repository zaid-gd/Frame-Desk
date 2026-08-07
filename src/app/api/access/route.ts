import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  createAccessToken,
  getAccessPassword,
  passwordsMatch,
} from "@/lib/access-wall";

export const runtime = "nodejs";

function json(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(request: NextRequest) {
  const expectedPassword = getAccessPassword();
  if (!expectedPassword) {
    return json("The private access wall has not been configured.", 503);
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return json("This request could not be verified.", 403);
  }

  let password: unknown;
  try {
    const body: unknown = await request.json();
    password = body && typeof body === "object" && "password" in body
      ? body.password
      : undefined;
  } catch {
    return json("Enter the private access password.", 400);
  }

  if (typeof password !== "string" || password.length > 256) {
    return json("Enter the private access password.", 400);
  }

  if (!(await passwordsMatch(password, expectedPassword))) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return json("That password is not correct.", 401);
  }

  const response = json("Access granted.", 200);
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: await createAccessToken(expectedPassword),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
