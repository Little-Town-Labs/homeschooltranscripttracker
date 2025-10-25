import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Test environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Test database connection
    const dbResult = await db.execute(sql`SELECT 1 as test`);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connected: true,
        testQuery: dbResult.rows?.[0] ?? null,
      }
    });
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      environment: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        AUTH_SECRET: !!process.env.AUTH_SECRET,
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
      }
    }, { status: 500 });
  }
} 