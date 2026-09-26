import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Refreshes the auth session and performs optimistic redirects for protected
 * areas. Authorization is always re-checked on the server (layouts, actions,
 * route handlers, and RLS) — this is only a convenience layer.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const needsAuth = pathname.startsWith("/app") || pathname.startsWith("/admin");
  if (needsAuth && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Survey pages and reports must never be cached by shared caches.
  if (pathname.startsWith("/s/") || pathname.startsWith("/app") || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
