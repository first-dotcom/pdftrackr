import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { config as appConfig } from "./lib/config";

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    ...appConfig.seo.publicLandingPages,
    "/sign-in",
    "/sign-up",
    "/sso-callback",
    "/cookies",
    "/data-rights",
    "/demo", // Public demo dashboard
    "/view/(.*)", // Allow public access to shared files
    "/api/public/(.*)",
    "/api/health",
    "/api/share/(.*)",
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: ["/api/health", "/_next/(.*)", "/favicon.ico", "/static/(.*)"],
  // Optional: Configure which routes to run middleware on
  // This is useful if you want to run middleware on all routes
  // except for certain ones
  beforeAuth: (req) => {
    // Handle any pre-auth logic here
    return;
  },
  afterAuth: (auth, req) => {
    // For public landing pages, set proper cache-control headers for SEO
    if (appConfig.seo.publicLandingPages.includes(req.nextUrl.pathname as any)) {
      // Create a new response with proper cache headers for SEO
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return response;
    }
    
    return NextResponse.next();
  },
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
  // Disable Edge Runtime for standalone builds to avoid Node.js API issues
  runtime: "nodejs",
};
