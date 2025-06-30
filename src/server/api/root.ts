import { postRouter } from "@/server/api/routers/post";
import { studentRouter } from "@/server/api/routers/student";
import { courseRouter } from "@/server/api/routers/course";
import { gradeRouter } from "@/server/api/routers/grade";
import { testScoreRouter } from "@/server/api/routers/test-score";
import { transcriptRouter } from "@/server/api/routers/transcript";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { billingRouter } from "@/server/api/routers/billing";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  student: studentRouter,
  course: courseRouter,
  grade: gradeRouter,
  testScore: testScoreRouter,
  transcript: transcriptRouter,
  dashboard: dashboardRouter,
  billing: billingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
