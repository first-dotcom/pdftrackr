import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up", 
    "/view/(.*)", // Allow public access to shared files
    "/api/public/(.*)",
    "/api/health",
    "/api/share/(.*)",
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    "/api/health",
    "/_next/(.*)",
    "/favicon.ico",
    "/static/(.*)",
  ],
  // Optional: Configure which routes to run middleware on
  // This is useful if you want to run middleware on all routes
  // except for certain ones
  beforeAuth: (req) => {
    // Handle any pre-auth logic here
    return;
  },
  afterAuth: (auth, req) => {
    // Handle any post-auth logic here
    return;
  },
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
