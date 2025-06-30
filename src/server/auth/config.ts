import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  tenants,
  type UserRole,
} from "@/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      tenantId: string | null;
      role: UserRole | null;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId: string | null;
    role: UserRole | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    /**
     * ...add more providers here.
     *
     * We can add other providers like email/password authentication
     * for families who prefer not to use Google OAuth.
     */
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.email) {
        // New user - create tenant and update user with tenant and role
        const familyName = user.name?.split(' ').slice(-1)[0] + " Family" || "Family";
        const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        
        const [newTenant] = await db.insert(tenants).values({
          name: familyName,
          primaryEmail: user.email,
          trialEndsAt,
        }).returning();

        // Update the user record with tenant and role
        await db.update(users)
          .set({ 
            tenantId: newTenant!.id, 
            role: "primary_guardian" 
          })
          .where(eq(users.id, user.id));

        // Send welcome email (async, don't wait)
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "noreply@homeschooltracker.com",
            to: user.email,
            subject: "Welcome to Homeschool Transcript Tracker! 🎓",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1>Welcome to Homeschool Transcript Tracker!</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                  <h2>Hi ${user.name}!</h2>
                  
                  <p>Thank you for joining Homeschool Transcript Tracker! We're excited to help you create professional transcripts for your students.</p>
                  
                  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h3>🎉 Your 30-Day Free Trial Has Started!</h3>
                    <p>You have full access to all features until ${trialEndsAt.toLocaleDateString()}. No credit card required during your trial.</p>
                  </div>

                  <h3>What you can do right now:</h3>
                  <ul>
                    <li>Add your students and set up their profiles</li>
                    <li>Create courses and record grades</li>
                    <li>Track test scores (SAT, ACT, AP, etc.)</li>
                    <li>Generate professional transcript previews</li>
                    <li>Monitor academic progress with analytics</li>
                  </ul>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started Now</a>
                  </div>

                  <p>Need help? Check out our Help Center or reply to this email with any questions. We're here to help!</p>

                  <p>Best regards,<br>The Homeschool Transcript Tracker Team</p>
                </div>
              </div>
            `,
          });
        } catch (error) {
          console.error("Failed to send welcome email:", error);
          // Don't throw - email failure shouldn't prevent signup
        }
      }
    },
  },
  callbacks: {
    session: async ({ session, user }) => {
      // Fetch fresh user data to get tenant info
      const dbUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      const userData = dbUser[0];
      
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          tenantId: userData?.tenantId ?? null,
          role: userData?.role ?? null,
        },
      };
    },
  },
} satisfies NextAuthConfig;
