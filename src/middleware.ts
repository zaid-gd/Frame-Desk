import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  getAccessPassword,
  verifyAccessToken,
} from "@/lib/access-wall";
import { isRetiredFrameDeskPath } from "@/lib/relay-runtime-boundary";

const PUBLIC_PATHS = new Set([
  "/access",
  "/api/access",
]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/__clerk/");
}

export default clerkMiddleware(async (_auth, request: NextRequest) => {
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

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasAccess) {
    const accessUrl = new URL("/access", request.url);
    const returnTo = `${pathname}${search}`;
    if (returnTo !== "/") accessUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(accessUrl);
  }

  if (isRetiredFrameDeskPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
