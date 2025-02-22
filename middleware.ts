// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Create matchers for your public routes
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in*', 
  '/sign-up*'
]);

export default clerkMiddleware((auth, req, evt) => {
  if (isPublicRoute(req)) {
    return;
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};