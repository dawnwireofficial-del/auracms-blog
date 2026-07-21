import { NextRequest, NextResponse } from "next/server";

// Routes accessible without a session
const PUBLIC_PAGE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const PUBLIC_API_PREFIXES = [
  "/api/login",
  "/api/register",
  "/api/forgot-password",
  "/api/reset-password",
  "/api/logout",
];

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    // Redirect already-logged-in users away from auth pages
    if (!pathname.startsWith("/api/")) {
      const token = req.cookies.get("admin_token")?.value;
      if (token) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_token")?.value;

  if (!token) {
    // API routes → 401 JSON instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|images/|uploads/).*)",
  ],
};
