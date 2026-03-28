import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

// Force dynamic rendering to prevent build-time database connection
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1 as test`);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}