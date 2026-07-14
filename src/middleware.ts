import { NextResponse, type NextRequest } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/session";

// Guards the dashboard. The public developer API (/api/v1/*) authenticates with
// Bearer keys and is excluded here. Runs on the Edge runtime — jose verifies the
// JWT without touching the database.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Protect dashboard routes only. Everything else (auth pages, /api/v1,
  // unsubscribe, static assets) is handled outside the matcher.
  matcher: ["/projects/:path*"],
};
