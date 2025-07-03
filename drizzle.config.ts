import { type Config } from "drizzle-kit";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
  tablesFilter: ["app_*"],
} satisfies Config;
