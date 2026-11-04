import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ALL_PLAN_SLUGS } from "@/app/data/plan-slugs";

const isAuthenticationRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/settings(.*)",
]);

const isPlanRestrictedApiRoute = createRouteMatcher([
  "/api/agent(.*)",
  "/api/agents(.*)",
  "/api/activity(.*)",
  "/api/tools(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
   if (request.nextUrl.pathname.startsWith("/api/inngest")) {
    return;
  }

  const { userId, has } = await auth();

  if (userId && isAuthenticationRoute(request)) {
    return NextResponse.redirect(new URL("/auth-redirect", request.url));
  }

  if (
    userId &&
    isPlanRestrictedApiRoute(request) &&
    !ALL_PLAN_SLUGS.some((plan) => has({ plan }))
  ) {
    return NextResponse.json(
      { success: false, message: "Choose a plan to use the agent workspace." },
      { status: 403 },
    );
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
