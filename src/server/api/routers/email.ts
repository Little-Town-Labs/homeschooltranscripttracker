import { z } from "zod";
import { eq, and } from "drizzle-orm";

import {
  createTRPCRouter,
  guardianProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { tenants, students } from "@/server/db/schema";

// Email service configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE ?? "resend"; // resend, sendgrid, postmark

// Initialize email service based on configuration
// EmailService will be instantiated after the class definition

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      if (EMAIL_SERVICE === "resend") {
        return await this.sendWithResend(template);
      } else if (EMAIL_SERVICE === "sendgrid") {
        return await this.sendWithSendGrid(template);
      } else {
        console.log("Email service not configured, logging email:", template);
        return true; // Development mode
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  private async sendWithResend(template: EmailTemplate): Promise<boolean> {
    try {
      // Skip actual email sending during build time
      if (!process.env.RESEND_API_KEY || process.env.NODE_ENV === 'production' && process.env.SKIP_ENV_VALIDATION) {
        console.log("Skipping email send during build:", template.subject);
        return true;
      }

      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@homeschooltracker.com",
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return result.error === null;
    } catch (error) {
      console.error("Resend email error:", error);
      return false;
    }
  }

  private async sendWithSendGrid(template: EmailTemplate): Promise<boolean> {
    try {
      // Note: @sendgrid/mail would need to be installed if using SendGrid
      // For now, fallback to console logging
      console.log("SendGrid not configured, would send:", template.subject);
      return true;
    } catch (error) {
      console.error("SendGrid email error:", error);
      return false;
    }
  }
}

const emailService = new EmailService();

// Email templates
class EmailTemplates {
  static welcome(userEmail: string, userName: string, trialEndsAt: Date): EmailTemplate {
    const appUrl = process.env.NEXTAUTH_URL ?? "https://homeschooltracker.com";
    const trialDays = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      to: userEmail,
      subject: "Welcome to Homeschool Transcript Tracker! 🎓",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .trial-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .features { list-style: none; padding: 0; }
            .features li { padding: 8px 0; }
            .features li:before { content: "✓"; color: #10b981; font-weight: bold; margin-right: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Homeschool Transcript Tracker!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              
              <p>Thank you for joining Homeschool Transcript Tracker! We're excited to help you create professional transcripts for your students.</p>
              
              <div class="trial-box">
                <h3>🎉 Your ${trialDays}-Day Free Trial Has Started!</h3>
                <p>You have full access to all features until ${trialEndsAt.toLocaleDateString()}. No credit card required during your trial.</p>
              </div>

              <h3>What you can do right now:</h3>
              <ul class="features">
                <li>Add your students and set up their profiles</li>
                <li>Create courses and record grades</li>
                <li>Track test scores (SAT, ACT, AP, etc.)</li>
                <li>Generate professional transcript previews</li>
                <li>Monitor academic progress with analytics</li>
              </ul>

              <div style="text-align: center;">
                <a href="${appUrl}" class="button">Get Started Now</a>
              </div>

              <h3>Need Help?</h3>
              <p>Check out our <a href="${appUrl}/help">Help Center</a> or reply to this email with any questions. We're here to help!</p>

              <p>Best regards,<br>The Homeschool Transcript Tracker Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Homeschool Transcript Tracker!

Hi ${userName}!

Thank you for joining Homeschool Transcript Tracker! Your ${trialDays}-day free trial has started.

Get started now: ${appUrl}

During your trial, you can:
• Add students and set up profiles
• Create courses and record grades  
• Track test scores (SAT, ACT, AP, etc.)
• Generate transcript previews
• Monitor academic progress

Need help? Visit ${appUrl}/help or reply to this email.

Best regards,
The Homeschool Transcript Tracker Team`
    };
  }

  static trialExpiring(userEmail: string, userName: string, daysRemaining: number): EmailTemplate {
    const appUrl = process.env.NEXTAUTH_URL ?? "https://homeschooltracker.com";

    return {
      to: userEmail,
      subject: `Your trial expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} - Continue your journey! 📚`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Trial is Ending Soon!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              
              <div class="warning-box">
                <h3>⏰ ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''} Remaining</h3>
                <p>Your free trial will end soon. Subscribe now to continue accessing all features without interruption.</p>
              </div>

              <p>Don't lose access to:</p>
              <ul>
                <li>Professional transcript generation</li>
                <li>Academic progress tracking</li>
                <li>Grade and test score management</li>
                <li>Multi-student family accounts</li>
              </ul>

              <div style="text-align: center;">
                <a href="${appUrl}/billing" class="button">Subscribe Now</a>
              </div>

              <p>Questions about pricing or features? We're here to help!</p>

              <p>Best regards,<br>The Homeschool Transcript Tracker Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your Homeschool Transcript Tracker trial expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}!

Hi ${userName}!

Your free trial is ending soon. Subscribe now to continue accessing all features.

Subscribe: ${appUrl}/billing

Don't lose access to professional transcript generation, progress tracking, and more.

Questions? Reply to this email and we'll help!

Best regards,
The Homeschool Transcript Tracker Team`
    };
  }

  static subscriptionConfirmation(userEmail: string, userName: string, studentCount: number, monthlyAmount: number): EmailTemplate {
    const appUrl = process.env.NEXTAUTH_URL ?? "https://homeschooltracker.com";

    return {
      to: userEmail,
      subject: "Subscription Confirmed - Welcome to the Full Experience! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .success-box { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              
              <div class="success-box">
                <h3>🎉 Welcome to the Full Experience!</h3>
                <p>Your subscription for ${studentCount} student${studentCount > 1 ? 's' : ''} is now active at $${monthlyAmount.toFixed(2)}/month.</p>
              </div>

              <p>You now have unlimited access to:</p>
              <ul>
                <li>✓ Professional PDF transcript generation</li>
                <li>✓ Unlimited students and courses</li>
                <li>✓ Advanced academic analytics</li>
                <li>✓ Test score tracking and management</li>
                <li>✓ Priority email support</li>
              </ul>

              <div style="text-align: center;">
                <a href="${appUrl}" class="button">Access Your Dashboard</a>
              </div>

              <p>Need help getting started? Check out our <a href="${appUrl}/help">Help Center</a> or reply to this email.</p>

              <p>Thank you for choosing Homeschool Transcript Tracker!</p>

              <p>Best regards,<br>The Homeschool Transcript Tracker Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Subscription Confirmed!

Hi ${userName}!

Your subscription for ${studentCount} student${studentCount > 1 ? 's' : ''} is now active at $${monthlyAmount.toFixed(2)}/month.

You now have unlimited access to professional transcript generation, analytics, and more.

Access your dashboard: ${appUrl}

Thank you for choosing Homeschool Transcript Tracker!

Best regards,
The Homeschool Transcript Tracker Team`
    };
  }

  static paymentFailed(userEmail: string, userName: string, retryUrl: string): EmailTemplate {
    return {
      to: userEmail,
      subject: "Payment Issue - Action Required 💳",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .error-box { background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Issue</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              
              <div class="error-box">
                <h3>💳 Payment Could Not Be Processed</h3>
                <p>We were unable to process your payment. Your subscription remains active, but please update your payment method to avoid service interruption.</p>
              </div>

              <p>Common reasons for payment failures:</p>
              <ul>
                <li>Expired credit card</li>
                <li>Insufficient funds</li>
                <li>Bank declined the transaction</li>
                <li>Outdated billing information</li>
              </ul>

              <div style="text-align: center;">
                <a href="${retryUrl}" class="button">Update Payment Method</a>
              </div>

              <p>Need help? Reply to this email and we'll assist you right away.</p>

              <p>Best regards,<br>The Homeschool Transcript Tracker Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Payment Issue - Action Required

Hi ${userName}!

We were unable to process your payment. Please update your payment method to avoid service interruption.

Update payment method: ${retryUrl}

Common reasons: expired card, insufficient funds, or bank declined the transaction.

Need help? Reply to this email.

Best regards,
The Homeschool Transcript Tracker Team`
    };
  }

  static transcriptGenerated(userEmail: string, userName: string, studentName: string, transcriptUrl: string): EmailTemplate {
    return {
      to: userEmail,
      subject: `Transcript Ready: ${studentName} 📄`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .success-box { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Transcript Ready!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              
              <div class="success-box">
                <h3>📄 ${studentName}'s Transcript is Ready</h3>
                <p>The professional transcript has been generated and is ready for download.</p>
              </div>

              <p>Your transcript includes:</p>
              <ul>
                <li>Complete academic record</li>
                <li>GPA calculations</li>
                <li>Course credits by subject</li>
                <li>Test scores (if applicable)</li>
                <li>Professional formatting for college applications</li>
              </ul>

              <div style="text-align: center;">
                <a href="${transcriptUrl}" class="button">Download Transcript</a>
              </div>

              <p><strong>Important:</strong> This transcript is valid for college applications and meets standard academic requirements.</p>

              <p>Best regards,<br>The Homeschool Transcript Tracker Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Transcript Ready: ${studentName}

Hi ${userName}!

${studentName}'s professional transcript has been generated and is ready for download.

Download: ${transcriptUrl}

This transcript includes the complete academic record, GPA calculations, course credits, and test scores in professional formatting for college applications.

Best regards,
The Homeschool Transcript Tracker Team`
    };
  }
}

export const emailRouter = createTRPCRouter({
  // Send welcome email (called during user registration)
  sendWelcomeEmail: publicProcedure
    .input(z.object({
      userEmail: z.string().email(),
      userName: z.string(),
      trialEndsAt: z.date(),
    }))
    .mutation(async ({ input }) => {
      const template = EmailTemplates.welcome(
        input.userEmail,
        input.userName,
        input.trialEndsAt
      );
      
      return await emailService.sendEmail(template);
    }),

  // Send trial expiring warning
  sendTrialExpiringEmail: guardianProcedure
    .input(z.object({
      daysRemaining: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      if (!tenant[0]) {
        throw new Error("Tenant not found");
      }

      const template = EmailTemplates.trialExpiring(
        tenant[0].primaryEmail,
        tenant[0].name,
        input.daysRemaining
      );
      
      return await emailService.sendEmail(template);
    }),

  // Send subscription confirmation
  sendSubscriptionConfirmation: guardianProcedure
    .input(z.object({
      studentCount: z.number(),
      monthlyAmount: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      if (!tenant[0]) {
        throw new Error("Tenant not found");
      }

      const template = EmailTemplates.subscriptionConfirmation(
        tenant[0].primaryEmail,
        tenant[0].name,
        input.studentCount,
        input.monthlyAmount
      );
      
      return await emailService.sendEmail(template);
    }),

  // Send payment failed notification
  sendPaymentFailedEmail: guardianProcedure
    .input(z.object({
      retryUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      if (!tenant[0]) {
        throw new Error("Tenant not found");
      }

      const template = EmailTemplates.paymentFailed(
        tenant[0].primaryEmail,
        tenant[0].name,
        input.retryUrl
      );
      
      return await emailService.sendEmail(template);
    }),

  // Send transcript generated notification
  sendTranscriptGeneratedEmail: guardianProcedure
    .input(z.object({
      studentId: z.string().uuid(),
      transcriptUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1);

      const student = await ctx.db
        .select()
        .from(students)
        .where(and(eq(students.id, input.studentId), eq(students.tenantId, ctx.tenantId)))
        .limit(1);

      if (!tenant[0] || !student[0]) {
        throw new Error("Tenant or student not found");
      }

      const studentName = `${student[0].firstName} ${student[0].lastName}`;
      
      const template = EmailTemplates.transcriptGenerated(
        tenant[0].primaryEmail,
        tenant[0].name,
        studentName,
        input.transcriptUrl
      );
      
      return await emailService.sendEmail(template);
    }),

  // Test email functionality (development only)
  sendTestEmail: guardianProcedure
    .input(z.object({
      to: z.string().email(),
      type: z.enum(["welcome", "trial_expiring", "subscription_confirmed", "payment_failed", "transcript_ready"]),
    }))
    .mutation(async ({ input }) => {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Test emails not available in production");
      }

      let template: EmailTemplate;
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 30);

      switch (input.type) {
        case "welcome":
          template = EmailTemplates.welcome(input.to, "Test User", testDate);
          break;
        case "trial_expiring":
          template = EmailTemplates.trialExpiring(input.to, "Test User", 3);
          break;
        case "subscription_confirmed":
          template = EmailTemplates.subscriptionConfirmation(input.to, "Test User", 2, 14.40);
          break;
        case "payment_failed":
          template = EmailTemplates.paymentFailed(input.to, "Test User", "https://example.com/billing");
          break;
        case "transcript_ready":
          template = EmailTemplates.transcriptGenerated(input.to, "Test User", "John Doe", "https://example.com/transcript.pdf");
          break;
        default:
          throw new Error("Invalid email type");
      }
      
      return await emailService.sendEmail(template);
    }),
});