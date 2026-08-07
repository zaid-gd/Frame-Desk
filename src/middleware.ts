import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  getAccessPassword,
  verifyAccessToken,
} from "@/lib/access-wall";

const PUBLIC_PATHS = new Set([
  "/access",
  "/api/access",
]);

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const password = getAccessPassword();
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const hasAccess = password ? await verifyAccessToken(token, password) : false;

  if (pathname === "/access" && hasAccess) {
    const requestedPath = request.nextUrl.searchParams.get("returnTo");
    const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!hasAccess) {
    const accessUrl = new URL("/access", request.url);
    const returnTo = `${pathname}${search}`;
    if (returnTo !== "/") accessUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(accessUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
